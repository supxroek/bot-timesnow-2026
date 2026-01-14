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
      dayOff,
    } = info;

    // 2. Determine Date Period
    const { cycleStart, cycleEnd } = this.calculateReportPeriod(
      targetDate,
      report_date
    );

    // 3. Fetch All Data
    const data = await this.fetchReportData(
      employeeId,
      ID_or_Passport_Number,
      companyId,
      leave_hub_company_id,
      cycleStart,
      cycleEnd
    );

    // 4. Calculate Stats & Daily Statuses
    const { stats, dailyStatuses } = this.processDailyStats(
      cycleStart,
      cycleEnd,
      data,
      employeeId,
      dayOff
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

    const [attendance, forgetRequests, leaves, swaps, workingTimes] =
      await Promise.all([
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
      ]);

    return { attendance, forgetRequests, leaves, swaps, workingTimes };
  }

  /**
   * Process daily records to generate stats and statuses
   */
  processDailyStats(cycleStart, cycleEnd, data, employeeId, dayOff) {
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

    while (current.isBefore(cycleEnd) || current.isSame(cycleEnd, "day")) {
      const result = this.evaluateDayStatus(
        current,
        data,
        employeeId,
        dayOff,
        today
      );
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
  evaluateDayStatus(currentDate, data, employeeId, dayOff, today) {
    const dateStr = currentDate.format("YYYY-MM-DD");
    const { swaps, leaves, attendance, forgetRequests, workingTimes } = data;

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

    // 2. Check Leave
    const leave = leaves.find((l) => {
      const s = dayjs(l.start_date);
      const e = dayjs(l.end_date);
      const d = dayjs(dateStr);
      return (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e));
    });
    if (leave) {
      return {
        statusText: `ลา (${leave.leave_type_name})`,
        color: "#f59e0b",
        isLeave: true,
        leaveType: leave.leave_type_name,
        dateStr,
      };
    }

    // 3. Check Attendance
    const att = attendance.find(
      (a) => dayjs(a.created_at).format("YYYY-MM-DD") === dateStr
    );
    const fag = forgetRequests.find(
      (f) => dayjs(f.forget_date).format("YYYY-MM-DD") === dateStr
    );

    if (att || fag) {
      return this.calculateWorkStatus(
        att,
        fag,
        workingTimes,
        employeeId,
        currentDate,
        dateStr
      );
    }

    // 4. Check Day Off
    const shift = this.MatchShift(workingTimes, employeeId, currentDate);
    const dayName = currentDate.format("dddd");

    if (!shift && dayOff?.includes(dayName)) {
      return { statusText: "วันหยุด", color: "#6b7280", dateStr };
    }

    // 5. Default: Absent or Future
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
   * Calculate work and late status
   */
  calculateWorkStatus(
    att,
    fag,
    workingTimes,
    employeeId,
    currentDate,
    dateStr
  ) {
    let statusText = "มาทำงาน";
    let color = "#3b82f6";
    let isLate = false;
    let lateMinutes = 0;

    const shift = this.MatchShift(workingTimes, employeeId, currentDate);
    if (shift?.start_time) {
      const checkInTime = att?.start_time || fag?.forget_time;

      if (checkInTime) {
        const shiftStart = dayjs(`${dateStr}T${shift.start_time}`);
        const actualStart = dayjs(`${dateStr}T${checkInTime}`);

        if (actualStart.isAfter(shiftStart)) {
          lateMinutes = actualStart.diff(shiftStart, "minute");
          isLate = true;
          statusText += ` (สาย ${lateMinutes} น.)`;
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
