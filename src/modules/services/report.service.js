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

    const [
      attendance,
      forgetRequests,
      leaves,
      swaps,
      workingTimes,
      publicHolidays,
    ] = await Promise.all([
      reportModel.getAttendanceRecords(employeeId, startDateStr, endDateStr),
      reportModel.getForgetRequests(employeeId, startDateStr, endDateStr),
      reportModel.getLeaveRequests(
        passportId,
        leaveHubCompanyId,
        startDateStr,
        endDateStr
      ),
      reportModel.getSwapRequests(
        passportId,
        leaveHubCompanyId,
        startDateStr,
        endDateStr
      ),
      reportModel.getAllWorkingTime(companyId),
      reportModel.getPublicHolidays(
        leaveHubCompanyId,
        startDateStr,
        endDateStr
      ),
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

    // 1. Check Swap
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

    // 2. Check Public Holiday (New)
    const holiday = publicHolidays.find((h) => {
      // Handle potential date format differences from DB
      return (
        h.date === dateStr || dayjs(h.date).format("YYYY-MM-DD") === dateStr
      );
    });
    if (holiday) {
      return {
        statusText: holiday.name, // Display Holiday Name
        color: "#10b981",
        isHoliday: true,
        dateStr,
      };
    }

    // 3. Check Leave (Full Day)
    // Filter leaves for this day
    const dailyLeaves = leaves.filter((l) => {
      const s = dayjs(l.start_date);
      const e = dayjs(l.end_date);
      const d = dayjs(dateStr);
      return (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e));
    });

    // Check for Full Day Leave (assuming null start_time means full day)
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

    // 4. Check Attendance / Forget Request
    const att = attendance.find(
      (a) => dayjs(a.created_at).format("YYYY-MM-DD") === dateStr
    );
    const fag = forgetRequests.find(
      (f) => dayjs(f.forget_date).format("YYYY-MM-DD") === dateStr
    );

    if (att || fag) {
      // Pass hourly leaves if any
      const hourlyLeaves = dailyLeaves.filter((l) => l.start_time);
      return this.calculateWorkStatus(
        att,
        fag,
        workingTimes,
        employeeInfo,
        currentDate,
        dateStr,
        hourlyLeaves
      );
    }

    // 5. Check Day Off
    const shift = this.MatchShift(workingTimes, employeeId, currentDate);
    const dayName = currentDate.format("dddd");

    if (!shift && dayOff?.includes(dayName)) {
      return { statusText: "วันหยุด", color: "#6b7280", dateStr };
    }

    // 6. Default: Absent or Future
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
   * Calculate work and late status with precise logic
   */
  calculateWorkStatus(
    att,
    fag,
    workingTimes,
    employeeInfo,
    currentDate,
    dateStr,
    hourlyLeaves = []
  ) {
    const { employeeId } = employeeInfo;
    let statusText = "มาทำงาน";
    let color = "#3b82f6";
    let isLate = false;
    let lateMinutes = 0;

    const shift = this.MatchShift(workingTimes, employeeId, currentDate);
    if (shift?.start_time) {
      // Free Time Support: If shift.free_time === 1, skip late check
      // Note: free_time is part of workingTime definition
      if (Number(shift.free_time) === 1) {
        return {
          statusText,
          color,
          isWork: true,
          isLate: false,
          lateMinutes: 0,
          dateStr,
        };
      }

      const checkInTime = att?.start_time || fag?.forget_time;

      if (checkInTime) {
        let shiftStart = dayjs(`${dateStr}T${shift.start_time}`);
        const actualStart = dayjs(`${dateStr}T${checkInTime}`);

        // Hourly Leave Adjustment
        // If there's an hourly leave starting at shift start, adjust shiftStart
        const startLeave = hourlyLeaves.find((l) => {
          if (!l.start_time) return false;
          // Simple string match for HH:mm
          return (
            l.start_time.substring(0, 5) === shift.start_time.substring(0, 5)
          );
        });

        if (startLeave) {
          shiftStart = dayjs(`${dateStr}T${startLeave.end_time}`);
          // Optional: You could note the hourly leave in status text
        }

        if (actualStart.isAfter(shiftStart)) {
          lateMinutes = actualStart.diff(shiftStart, "minute");
          if (lateMinutes > 0) {
            isLate = true;
            statusText += ` (สาย ${lateMinutes} น.)`;
          }
        }
      }
    }
    return { statusText, color, isWork: true, isLate, lateMinutes, dateStr };
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
