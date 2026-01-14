/**
 * src/modules/services/report.service.js
 *
 * Service for generating monthly attendance and leave reports.
 * Aggregates data from Time Now and Leave Hub.
 */

const dayjs = require("dayjs");
const reportModel = require("../models/report.model");
// Import standard config or utils if needed

class ReportService {
  /**
   * Generate Monthly Report Data
   * @param {string} lineUserId
   * @param {string|Date} [targetDate] Date within the target period (default: now)
   */
  /**
   * Generate Monthly Report Data
   * @param {string} lineUserId
   * @param {string|Date} [targetDate] Date within the target period (default: now)
   */
  async generateMonthlyReport(lineUserId, targetDate = new Date()) {
    // 1. Get Employee & Company Context
    const info = await reportModel.getEmployeeAndCompany(lineUserId);
    if (!info) {
      throw new Error("Employee not found or not linked to LINE.");
    }

    const {
      employeeId,
      employeeName,
      ID_or_Passport_Number,
      companyId,
      report_date,
      leave_hub_company_id,
    } = info;

    // 2. Determine Date Period
    const { cycleStart, cycleEnd } = this.calculateReportPeriod(
      targetDate,
      report_date
    );

    // 3. Fetch All Data
    const data = await this.runWithRetry(() =>
      this.fetchReportData(
        employeeId,
        ID_or_Passport_Number,
        companyId,
        leave_hub_company_id,
        cycleStart,
        cycleEnd
      )
    );

    // 4. Calculate Stats & Daily Statuses
    const { stats, dailyStatuses } = this.processDailyStats(
      cycleStart,
      cycleEnd,
      data,
      info // Pass full info object (includes start_date, free_time)
    );

    return {
      period: `${cycleStart.format("D MMM")} - ${cycleEnd.format(
        "D MMM YYYY"
      )}`,
      employeeName,
      stats,
      dailyStatuses,
    };
  }

  /**
   * Resilience: Retry Mechanism for Deadlocks
   * @param {Function} task
   * @param {number} retries
   */
  async runWithRetry(task, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await task();
      } catch (error) {
        // MySQL Deadlock Error Code: 1213
        if (error.code === "ER_LOCK_DEADLOCK" || error.errno === 1213) {
          if (i === retries - 1) throw error;
          console.warn(`Deadlock detected. Retrying... (${i + 1}/${retries})`);
          await new Promise((res) => setTimeout(res, 100 * (i + 1))); // Backoff
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Calculate report period based on target date and report cutoff date
   */
  calculateReportPeriod(targetDate, report_date) {
    const tDate = dayjs(targetDate);
    const rDate = report_date || 25;
    let cycleEnd;

    if (tDate.date() > rDate) {
      cycleEnd = tDate.add(1, "month").date(rDate);
    } else {
      cycleEnd = tDate.date(rDate);
    }
    const cycleStart = cycleEnd.subtract(1, "month").add(1, "day");
    return { cycleStart, cycleEnd };
  }

  /**
   * Fetch all necessary data for the report
   */
  async fetchReportData(
    employeeId,
    passportId,
    companyId,
    leaveHubCompanyId,
    cycleStart,
    cycleEnd
  ) {
    const startDateStr = cycleStart.format("YYYY-MM-DD");
    const endDateStr = cycleEnd.format("YYYY-MM-DD");

    const attendancePromise = reportModel.getAttendanceRecords(
      employeeId,
      startDateStr,
      endDateStr
    );
    const forgetPromise = reportModel.getForgetRequests(
      employeeId,
      startDateStr,
      endDateStr
    );
    const workingTimePromise = reportModel.getAllWorkingTime(companyId);

    // Conditional Fetching from Leave Hub
    const leavePromise = leaveHubCompanyId
      ? reportModel.getLeaveRequests(
          passportId,
          leaveHubCompanyId,
          startDateStr,
          endDateStr
        )
      : Promise.resolve([]);

    const swapPromise = leaveHubCompanyId
      ? reportModel.getSwapRequests(
          passportId,
          leaveHubCompanyId,
          startDateStr,
          endDateStr
        )
      : Promise.resolve([]);

    const holidayPromise = leaveHubCompanyId
      ? reportModel.getPublicHolidays(
          leaveHubCompanyId,
          startDateStr,
          endDateStr
        )
      : Promise.resolve([]);

    const [
      attendance,
      forgetRequests,
      leaves,
      swaps,
      workingTimes,
      publicHolidays,
    ] = await Promise.all([
      attendancePromise,
      forgetPromise,
      leavePromise,
      swapPromise,
      workingTimePromise,
      holidayPromise,
    ]);

    return {
      attendance,
      forgetRequests,
      leaves,
      swaps,
      workingTimes,
      publicHolidays,
    };
  }

  /**
   * Process daily records to generate stats and statuses
   */
  processDailyStats(cycleStart, cycleEnd, data, employeeInfo) {
    const { start_date } = employeeInfo;
    const stats = {
      totalWorkDays: 0,
      totalLeaves: 0,
      totalLateMinutes: 0,
      totalLateCount: 0,
      totalAbsent: 0,
      leaveDetails: {},
      swapCount: 0,
      totalOTHours: 0,
    };
    const dailyStatuses = [];
    let current = cycleStart;
    const today = dayjs();
    const startDateObj = start_date ? dayjs(start_date) : null;

    while (current.isBefore(cycleEnd) || current.isSame(cycleEnd, "day")) {
      // Resilience: Valid Start Date Check
      // If current date is before employment start date, status is "-"
      if (startDateObj && current.isBefore(startDateObj, "day")) {
        dailyStatuses.push({
          date: current.format("DD/MM/YYYY"),
          rawDate: current.format("YYYY-MM-DD"),
          status: "-",
          color: "#d1d5db",
        });
        current = current.add(1, "day");
        continue;
      }

      const result = this.evaluateDayStatus(current, data, employeeInfo, today);
      this.accumulateStats(stats, result);

      dailyStatuses.push({
        date: current.format("DD/MM/YYYY"),
        rawDate: result.dateStr,
        status: result.statusText,
        color: result.color,
      });

      current = current.add(1, "day");
    }

    return { stats, dailyStatuses };
  }

  /**
   * Accumulate statistics based on daily result
   */
  accumulateStats(stats, result) {
    if (result.isSwap) stats.swapCount++;
    if (result.isLeave) {
      stats.totalLeaves++;
      stats.leaveDetails[result.leaveType] =
        (stats.leaveDetails[result.leaveType] || 0) + 1;
    }
    if (result.otHours) {
      stats.totalOTHours = (stats.totalOTHours || 0) + result.otHours;
    }
    if (result.isWork) {
      stats.totalWorkDays++;
      if (result.isLate) {
        stats.totalLateCount++;
        stats.totalLateMinutes += result.lateMinutes;
      }
    }
    if (result.isAbsent) stats.totalAbsent++;
  }

  /**
   * Evaluate the status for a single day
   */
  /**
   * Evaluate the status for a single day
   */
  evaluateDayStatus(currentDate, data, employeeInfo, today) {
    const dateStr = currentDate.format("YYYY-MM-DD");
    const {
      swaps,
      leaves,
      attendance,
      forgetRequests,
      workingTimes,
      publicHolidays,
    } = data;
    const { employeeId, dayOff } = employeeInfo;

    // 1. Check Swap (Compensatory Day) - Highest Priority
    const swap = swaps.find(
      (s) => dayjs(s.new_date).format("YYYY-MM-DD") === dateStr
    );
    if (swap) {
      return {
        statusText: "หยุดชดเชย",
        color: "#10b981",
        isSwap: true,
        dateStr,
      };
    }

    // 2. Prepare Context (Holiday, Day Off, Shift)
    const holiday = publicHolidays.find((h) => {
      return (
        h.date === dateStr || dayjs(h.date).format("YYYY-MM-DD") === dateStr
      );
    });

    const shift = this.MatchShift(workingTimes, employeeId, currentDate);
    const dayName = currentDate.format("dddd");
    const isDayOff = !shift && dayOff?.includes(dayName);

    // 3. Check Attendance (Worked) - Priority: Work > Holiday > Leave > Day Off
    const att = attendance.find(
      (a) => dayjs(a.created_at).format("YYYY-MM-DD") === dateStr
    );
    const fag = forgetRequests.find(
      (f) => dayjs(f.forget_date).format("YYYY-MM-DD") === dateStr
    );

    const dailyLeaves = leaves.filter((l) => {
      const s = dayjs(l.start_date);
      const e = dayjs(l.end_date);
      const d = dayjs(dateStr);
      return (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e));
    });

    if (att || fag) {
      const hourlyLeaves = dailyLeaves.filter((l) => l.start_time);
      return this.calculateWorkStatus(
        att,
        fag,
        shift,
        dateStr,
        hourlyLeaves,
        holiday,
        isDayOff
      );
    }

    // 4. Check Public Holiday (No Work)
    if (holiday) {
      return {
        statusText: holiday.name,
        color: "#10b981",
        isHoliday: true,
        dateStr,
      };
    }

    // 5. Check Full Day Leave
    const fullDayLeave = dailyLeaves.find((l) => !l.start_time);
    if (fullDayLeave) {
      return {
        statusText: `ลา (${fullDayLeave.leave_type_name})`,
        color: "#f59e0b",
        isLeave: true,
        leaveType: fullDayLeave.leave_type_name,
        dateStr,
      };
    }

    // 6. Check Day Off
    if (isDayOff) {
      return { statusText: "วันหยุด", color: "#6b7280", dateStr };
    }

    // 7. Default: Absent or Future
    if (currentDate.isAfter(today)) {
      return { statusText: "-", color: "#d1d5db", dateStr };
    }

    return {
      statusText: "ขาดงาน / ลืมลงเวลา",
      color: "#ef4444",
      isAbsent: true,
      dateStr,
    };
  }

  /**
   * Calculate work status including OT, Late, and Hourly Leave
   */
  calculateWorkStatus(
    att,
    fag,
    shift,
    dateStr,
    hourlyLeaves = [],
    holiday = null,
    isDayOff = false
  ) {
    let statusText = "มาทำงาน";
    let color = "#3b82f6"; // Blue
    let lateMinutes = 0;
    let otHours = 0;

    // 1. Context Override (Work on Holiday / Day Off)
    if (holiday) {
      statusText = `วันหยุด (${holiday.name}) มาทำงาน`; // Holiday (Name) Worked ?? Just "Holiday (Worked)"
      // Or "HolidayName (Worked)"
      statusText = `${holiday.name} (มาทำงาน)`;
      color = "#10b981"; // Green to indicate good? Or Blue? Requirement: "Show Holiday (Worked)"
    } else if (isDayOff) {
      statusText = "วันหยุด (มาทำงาน)";
      color = "#10b981";
    }

    // 2. OT Calculation
    // att.ot_start_time / att.ot_end_time provided by Time Now timestamp_records
    if (att?.ot_start_time && att.ot_end_time) {
      const otStart = dayjs(`${dateStr}T${att.ot_start_time}`);
      const otEnd = dayjs(`${dateStr}T${att.ot_end_time}`);

      // Handle PM to AM OT?? Usually OT is after work or before work.
      // Assuming same day for simplicity unless we see date.
      // Safe to use diff. If end is before start, add 1 day to end.
      let diff = otEnd.diff(otStart, "hour", true);
      if (diff < 0) {
        diff = otEnd.add(1, "day").diff(otStart, "hour", true);
      }

      if (diff > 0) {
        otHours = Number.parseFloat(diff.toFixed(2)); // 2 decimal places? User said "2 hrs"
        // Let's use 1 decimal or integer if user wants "2 hrs".
        // Report usually allows decimals.
        // User Example: "+OT 2 ชม."
        const displayOT = Number.isInteger(diff) ? diff : diff.toFixed(1);
        statusText += ` (+OT ${displayOT} ชม.)`;
      }
    }

    // 3. Late Calculation
    if (shift?.start_time && Number(shift.free_time) !== 1) {
      const checkInTime = att?.start_time || fag?.forget_time;

      if (checkInTime) {
        let shiftStart = dayjs(`${dateStr}T${shift.start_time}`);
        const actualStart = dayjs(`${dateStr}T${checkInTime}`);

        // Hourly Leave (Morning) Logic
        // Check if there is a leave that ends after shift start and before shift end?
        // Requirement: "Leave morning (before work) -> Shift Start adjust to Leave End"
        const morningLeave = hourlyLeaves.find((l) => {
          // Assume l.start_time / l.end_time exists
          // Logic: Leave Start <= Shift Start AND Leave End > Shift Start
          if (!l.start_time || !l.end_time) return false;

          // Convert to times on this day
          const lStart = dayjs(`${dateStr}T${l.start_time}`);
          const lEnd = dayjs(`${dateStr}T${l.end_time}`);

          // Leave covers the start of the shift
          return (
            (lStart.isBefore(shiftStart) || lStart.isSame(shiftStart)) &&
            lEnd.isAfter(shiftStart)
          );
        });

        if (morningLeave) {
          shiftStart = dayjs(`${dateStr}T${morningLeave.end_time}`);
        }

        if (actualStart.isAfter(shiftStart)) {
          // Allow small buffer? 1 min? No, strict.
          const diffMin = actualStart.diff(shiftStart, "minute");
          if (diffMin > 0) {
            lateMinutes = diffMin;
            statusText += ` (สาย ${lateMinutes} น.)`;
            // Only flag late if not holiday/dayoff?
            // Normally if you work on holiday, late is late.
          }
        }
      }
    }

    // 4. Hourly Leave Display
    if (hourlyLeaves.length > 0) {
      hourlyLeaves.forEach((l) => {
        // Simplify display: (Leave 13:00-15:00)
        if (l.start_time && l.end_time) {
          const startF = l.start_time.substring(0, 5);
          const endF = l.end_time.substring(0, 5);
          statusText += `\n(ลา ${startF}-${endF})`;
        }
      });
    }

    return {
      statusText,
      color,
      isWork: true,
      isLate: lateMinutes > 0,
      lateMinutes,
      otHours,
      dateStr,
    };
  }

  // logic reused/adapted from workingTime.model.js
  MatchShift(allRows, employeeId, dateObj) {
    const dayOfMonth = dateObj.date();
    const month = dateObj.month() + 1;
    const dayOfWeek = dateObj.day() === 0 ? 7 : dateObj.day();

    // Iterate rows (sorted by priority in query: is_specific DESC, id DESC)
    for (const row of allRows) {
      if (
        this.checkId(row.employeeId, employeeId) &&
        this.isMatch(row, month, dayOfMonth, dayOfWeek)
      ) {
        return row;
      }
    }
    return null;
  }

  checkId(listStr, targetId) {
    if (!listStr) return false;
    try {
      const clean = String(listStr).replaceAll(/[\\[\]"]/g, "");
      const ids = clean.split(",").map((s) => s.trim());
      return ids.includes(String(targetId));
    } catch (err) {
      console.error("Error in checkId:", err);
      return false;
    }
  }

  checkDate(listStr, targetVal) {
    if (!listStr) return false;
    try {
      const clean = String(listStr).replaceAll(/[\\[\]"]/g, "");
      const vals = clean.split(",").map((s) => Number.parseInt(s.trim()));
      return vals.includes(targetVal);
    } catch (err) {
      console.error("Error in checkDate:", err);
      return false;
    }
  }

  isMatch(row, month, dayOfMonth, dayOfWeek) {
    if (row.month && row.date) {
      return row.month === month && this.checkDate(row.date, dayOfMonth);
    } else if (!row.month && row.date) {
      return this.checkDate(row.date, dayOfWeek);
    } else if (!row.month && !row.date) {
      return true; // Default shift
    }
    return false;
  }
}

module.exports = new ReportService();
