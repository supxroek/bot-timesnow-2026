const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
const isBetween = require("dayjs/plugin/isBetween");
dayjs.extend(duration);
dayjs.extend(isBetween);

const { normalizeDate, normalizeTime } = require("../../shared/utils/date");
const { Employee } = require("../models/employee.model");
const DevIOModel = require("../models/devIO.model");
const WorkingTimeModel = require("../models/workingTime.model");
const TimestampRecord = require("../models/timestamp.model");
const OvertimeModel = require("../models/overtime.model");
const lineProvider = require("../../shared/providers/line.provider");
const logger = require("../../shared/utils/logger");
const {
  attendanceSuccessMessage,
} = require("../../shared/templates/flex/modules/attendance.flex");

class AttendanceService {
  constructor() {
    this.beaconState = new Map(); // เก็บสถานะ Beacon { userId: { hwid, timestamp } }
    this.actionDebounce = new Map(); // New: Debounce map { userId: { action, timestamp } }
  }

  // =========================================================================
  // 0. Helper Methods (ฟังก์ชันช่วยทำงาน)
  // =========================================================================

  // ตรวจสอบอุปกรณ์และพนักงาน
  async _validateDeviceAndEmployee(lineUserId, hwid) {
    const device = await DevIOModel.findByHWID(hwid);
    if (!device) {
      logger.warn(`[Attendance] ไม่พบอุปกรณ์ HWID: ${hwid}`);
      return {
        error: true,
        result: { status: "error", message: "Unknown Device" },
      };
    }

    const employee = await Employee.findActiveByLineUserId({
      where: { userId: lineUserId },
    });
    if (!employee) {
      logger.warn(`[Attendance] ไม่พบพนักงานสำหรับ LineUserID: ${lineUserId}`);
      return {
        error: true,
        result: { status: "error", message: "Employee Unauthorized" },
      };
    }

    if (employee.companyId !== device.companyId) {
      logger.warn(
        `[Attendance] บริษัทไม่ตรงกัน Employee: ${employee.companyId}, Device: ${device.companyId}`
      );
      return {
        error: true,
        result: { status: "error", message: "Employee Unauthorized" },
      };
    }

    if (!this._isEmployeeAuthorizedForDevice(employee, device)) {
      logger.warn(
        `[Auth] Employee ${employee.id} tried to use unauthorized Device ${hwid}`
      );
      return {
        error: true,
        result: { status: "error", message: "Device Authorization Failed" },
      };
    }

    return { error: false, device, employee };
  }

  // ดึงกะการทำงานสำหรับวันนี้ (รวมกะกลางคืน)
  async _getWorkingTime(employee, now) {
    let todayStr = normalizeDate(now.toISOString());
    let workingTime = await WorkingTimeModel.findByEmployeeAndDate(
      employee.id,
      employee.companyId,
      todayStr
    );

    if (!workingTime && now.hour() < 6) {
      const yesterday = now.subtract(1, "day");
      const yesterdayStr = normalizeDate(yesterday.toISOString());
      const nightShift = await WorkingTimeModel.findByEmployeeAndDate(
        employee.id,
        employee.companyId,
        yesterdayStr,
        { onlyNightShift: true }
      );

      if (nightShift) {
        logger.info(
          `[Attendance] พบกะกลางคืนจากเมื่อวาน (${yesterdayStr}) สำหรับพนักงาน ${employee.id}`
        );
        workingTime = nightShift;
        todayStr = yesterdayStr;
      }
    }
    return { workingTime, todayStr };
  }

  // ดำเนินการบันทึกเวลาตาม Action ที่กำหนด
  async _executeTimestampUpdate(
    action,
    employee,
    workingTime,
    timestamp,
    currentTimeStr
  ) {
    if (action.type === "INSERT") {
      await TimestampRecord.createTimestamp({
        employeeid: employee.id,
        workingTimeId: workingTime.id,
        companyId: employee.companyId,
        [action.field]: currentTimeStr,
      });
    } else if (action.type === "UPDATE") {
      await TimestampRecord.updateTimestamp(timestamp.id, {
        [action.field]: currentTimeStr,
      });
    }
  }

  // ตรวจสอบว่าพนักงานมีสิทธิ์ใช้ Device นี้หรือไม่
  _isEmployeeAuthorizedForDevice(employee, device) {
    if (!device.employeeId || device.employeeId === "all") return true;

    // แปลง JSON String หรือ CSV เป็น Array IDs
    const cleanEmployeeIds = String(device.employeeId).replaceAll(
      /[\\[\]"]/g,
      ""
    );
    const allowedIds = cleanEmployeeIds.split(",").map((id) => id.trim());
    return allowedIds.includes(String(employee.id));
  }

  // ตรวจสอบว่าควรแจ้งเตือน Flex Message หรือไม่เมื่อเดินผ่าน Beacon
  _shouldNotifyForAction(workingTime, action, now, todayStr, device) {
    const targetTimeStr = this._getTargetTimeForAction(
      workingTime,
      action.field
    );

    // กรณีไม่มี target time (เช่น Break End ที่คำนวณแบบ Dynamic)
    if (!targetTimeStr && action.field !== "break_end_time") return null;

    const targetTime = targetTimeStr
      ? dayjs(`${todayStr} ${targetTimeStr}`)
      : null;

    // ถ้าเวลาปัจจุบัน >= (เป้าหมาย - 10 นาที) ให้แจ้งเตือน
    if (targetTime) {
      const diffMinutes = now.diff(targetTime, "minute"); // ถ้าเป็นบวกคือเลยเวลา, ลบคือยังไม่ถึง
      if (diffMinutes >= -10) {
        return {
          device: device,
          actionLabel: action.label,
          actionTime: targetTimeStr,
        };
      }
    } else if (
      action.field === "break_end_time" ||
      action.field === "start_time"
    ) {
      // กรณี Fallback สำหรับ Dynamic Time
      return {
        device: device,
        actionLabel: action.label,
        actionTime: workingTime[action.field] || "ตอนนี้",
      };
    }

    return null;
  }

  // ดึงเวลาที่เกี่ยวข้องกับ Action ที่จะทำ
  _getTargetTimeForAction(wt, field) {
    if (!wt) return null;
    return wt[field];
  }

  // ดึง Action ล่าสุดที่บันทึกไปแล้ว
  _getLastRecordedAction(timestamp) {
    if (!timestamp) return null;
    const priority = [
      { field: "ot_end_time", label: "OT ออก" },
      { field: "ot_start_time", label: "OT เข้า" },
      { field: "end_time", label: "เลิกงาน" },
      { field: "break_end_time", label: "เข้างาน(บ่าย)" },
      { field: "break_start_time", label: "เริ่มพัก" },
      { field: "start_time", label: "เข้างาน" },
    ];

    for (const item of priority) {
      if (timestamp[item.field]) {
        return { label: item.label, time: timestamp[item.field] };
      }
    }
    return null;
  }

  // =========================================================================
  // ตรวจสอบการกระทำซ้ำ (Debounce) ภายในระยะเวลาที่กำหนด
  _checkDebounce(userId, action) {
    if (!this.actionDebounce.has(userId)) return false;
    const state = this.actionDebounce.get(userId);
    if (state.action !== action) return false;

    // Check time diff (e.g., 60 seconds)
    const diff = dayjs().diff(state.timestamp, "second");
    return diff < 60;
  }

  // อัพเดตสถานะ Debounce เพื่อป้องกันการบันทึกซ้ำ
  _updateDebounce(userId, action) {
    this.actionDebounce.set(userId, { action, timestamp: dayjs() });
  }

  // กำหนด Action สำหรับช่วงเช้า
  _determineMorningAction(now, breakStart, breakEnd, endTime, tr) {
    // กรณีพิเศษ: ถ้าเลยเวลาเลิกงานแล้ว (ลืมเข้างาน แต่จะออกงาน) -> ให้ข้ามไป End Time
    // * แก้ไขตามกฎข้อ 4: เลิกงานได้ตั้งแต่เวลาที่กะระบุขึ้นไป
    if (endTime && now.isAfter(endTime)) {
      return {
        type: tr ? "UPDATE" : "INSERT",
        field: "end_time",
        label: "เลิกงาน",
      };
    }

    // ถ้าเลยเวลาพักไปแล้ว (Break Start passed)
    if (breakStart && now.isAfter(breakStart)) {
      if (breakEnd && now.isAfter(breakEnd)) {
        // เลยเวลาจบพัก -> เข้างานบ่าย (Break End)
        return {
          type: tr ? "UPDATE" : "INSERT",
          field: "break_end_time",
          label: "เข้างาน(บ่าย)",
        };
      }
      // ยังอยู่ในช่วงพัก -> เริ่มพัก (Break Start)
      return {
        type: tr ? "UPDATE" : "INSERT",
        field: "break_start_time",
        label: "เริ่มพัก",
      };
    }

    // กฎข้อ 1: เข้างานบันทึกก่อนเวลาได้ (หลังเวลา = สาย)
    return {
      type: tr ? "UPDATE" : "INSERT",
      field: "start_time",
      label: "เข้างาน",
    };
  }

  // กำหนด Action สำหรับช่วงพัก
  _determineBreakAction(now, breakStart) {
    // กฎข้อ 2: ลงก่อนเวลาพักได้ 5 นาที
    if (breakStart && now.isBefore(breakStart.subtract(5, "minute"))) {
      return {
        type: "NONE",
        reason: "ยังไม่ถึงเวลาพัก (ต้องไม่เกิน 5 นาทีก่อนเวลา)",
      };
    }
    return { type: "UPDATE", field: "break_start_time", label: "เริ่มพัก" };
  }

  // กำหนด Action สำหรับช่วงบ่าย
  _determineAfternoonAction() {
    // กฎข้อ 3: สิ้นสุดพัก ลงก่อนเวลาที่กะระบุได้ (อยู่ในช่วงพัก)
    // แต่ต้องระวังสับสนกับกฎ "ถ้าเกินจะถือว่าสาย"
    // ถ้าตอนนี้ < Break End (ยังไม่หมดเวลาพัก) -> ลงได้ (กลับก่อน)
    // ถ้าตอนนี้ > Break End (หมดเวลาพักแล้ว) -> ลงได้ (กลับสาย)
    // ตรงนี้แค่ Return Action การตรวจสอบสายจะทำตอนคำนวณ Report
    return { type: "UPDATE", field: "break_end_time", label: "กลับจากพัก" };
  }

  // กำหนด Action สำหรับช่วงเลิกงาน
  _determineEndAction(now, endTime) {
    // กฎข้อ 4: ลงได้ตั้งแต่เวลาที่กะระบุเป็นต้นไป (Strict Check)
    if (endTime && now.isBefore(endTime)) {
      return {
        type: "NONE",
        reason: "ยังไม่ถึงเวลาเลิกงาน",
      };
    }
    return { type: "UPDATE", field: "end_time", label: "เลิกงาน" };
  }

  // กำหนด Action สำหรับช่วง OT
  async _determineOTAction(tr, employeeId, companyId, now) {
    const hasOTStart = tr?.ot_start_time;
    const hasOTEnd = tr?.ot_end_time;

    // ง่ายๆ: จบงานปกติ -> เริ่ม OT -> จบ OT
    if (!hasOTStart) {
      // [New] 3.2 Check OT Permission
      const otPermission = await OvertimeModel.findActiveOvertime(
        employeeId,
        companyId,
        now.format("HH:mm:ss")
      );

      if (!otPermission) {
        return {
          type: "NONE",
          reason: "OT Permission Denied (ไม่อยู่ในช่วงเวลา หรือไม่มีสิทธิ์)",
        };
      }

      return { type: "UPDATE", field: "ot_start_time", label: "เริ่ม OT" };
    }

    if (!hasOTEnd) {
      return { type: "UPDATE", field: "ot_end_time", label: "จบ OT" };
    }

    return { type: "NONE", reason: "บันทึกครบทุกช่องแล้ว" };
  }

  // กำหนด Action สำหรับกรณี Free Time
  _determineFreeTimeAction(tr) {
    if (!tr) {
      return { type: "INSERT", field: "start_time", label: "เข้างาน" };
    }
    if (!tr.end_time) {
      return { type: "UPDATE", field: "end_time", label: "เลิกงาน" };
    }
    return { type: "UPDATE", field: "end_time", label: "เลิกงาน(อัปเดต)" };
  }

  // =========================================================================
  // 1. ส่วนจัดการสถานะ Beacon (Beacon State Management)
  // =========================================================================

  // อัพเดตสถานะ Beacon เมื่อได้รับ Event
  updateBeaconState(userId, hwid) {
    logger.info(
      `[Attendance] อัปเดตสถานะ Beacon สำหรับ User: ${userId}, HWID: ${hwid}`
    );
    this.beaconState.set(userId, {
      hwid,
      timestamp: dayjs(),
    });
    logger.debug(
      `[Attendance] จำนวน Beacon State ปัจจุบัน: ${this.beaconState.size}`
    );
  }

  // =========================================================================
  // 2. ส่วนประมวลผลหลัก (Main Processing)
  // =========================================================================

  // ตรวจสอบการลงเวลาด้วยตัวเอง (Manual Check via Menu)
  // ใช้ข้อมูล State จาก Beacon ล่าสุด
  async processManualAttendance(userId) {
    const state = this.beaconState.get(userId);

    logger.info(`[Attendance] ตรวจสอบ Manual Check สำหรับ User: ${userId}`);

    // ตรวจสอบว่ามี State หรือไม่ และหมดอายุหรือยัง (> 10 นาที)
    if (!state) {
      logger.warn(`[Attendance] ไม่พบ Beacon State สำหรับ User ${userId}`);
      return { status: "error", message: "Beacon Expired or Not Found" };
    }

    if (dayjs().diff(state.timestamp, "minute") > 10) {
      logger.info(`[Attendance] Beacon State หมดอายุสำหรับ ${userId}`);
      this.beaconState.delete(userId);
      return { status: "error", message: "Beacon Expired or Not Found" };
    }

    // เรียกใช้ตรรกะเดียวกับ Beacon Event
    return await this.processBeaconAttendance(userId, state.hwid);
  }

  // =========================================================================
  // 3. ส่วนประมวลผลการบันทึกเวลา (Attendance Processing)
  // =========================================================================

  /**
   * ประมวลผลการบันทึกเวลา (Core Logic)
   * @param {string} lineUserId
   * @param {string} hwid
   */
  async processBeaconAttendance(lineUserId, hwid) {
    try {
      logger.info(
        `[Attendance] กำลังประมวลผล Beacon สำหรับ ${lineUserId} HWID: ${hwid}`
      );

      // 1. Validate Device & Employee
      const { error, result, employee } = await this._validateDeviceAndEmployee(
        lineUserId,
        hwid
      );
      if (error) return result;

      // 2. Get Working Time
      const now = dayjs();
      const currentTimeStr = normalizeTime(now.format("HH:mm:ss"));
      const { workingTime, todayStr } = await this._getWorkingTime(
        employee,
        now
      );

      if (!workingTime) {
        logger.warn(
          `[Attendance] ไม่พบกะการทำงานสำหรับพนักงาน ${employee.id} วันที่ ${todayStr}`
        );
        return {
          status: "error",
          message: "No Shift Found",
          detail: "Please contact HR to assign a shift.",
        };
      }

      // 3. Get Existing Timestamp
      const timestamp = await TimestampRecord.findByEmployeeAndDate(
        employee.id,
        todayStr
      );

      // 4. Determine Action
      const action = await this.determineTimeAction(
        workingTime,
        now,
        timestamp,
        employee.id,
        employee.companyId
      );

      if (action.type === "NONE") {
        if (action.reason?.includes("OT Permission")) {
          logger.warn(
            `[OT] Overtime request denied for Employee ${employee.id} - No Permission Found`
          );
        }
        return {
          status: "info",
          message: "No action needed",
          detail: action.reason,
          data: {
            timestamp,
            workingTime,
            date: todayStr,
            latestAction: this._getLastRecordedAction(timestamp),
          },
        };
      }

      // 5. Debounce Check
      if (this._checkDebounce(employee.id, action.label)) {
        logger.info(
          `[Attendance] Action '${action.label}' ซ้ำซ้อนสำหรับ ${employee.id} (Debounced)`
        );
        return {
          status: "success",
          action: action.label,
          time: currentTimeStr,
          isDebounced: true,
        };
      }

      // 6. Execute Update
      await this._executeTimestampUpdate(
        action,
        employee,
        workingTime,
        timestamp,
        currentTimeStr
      );
      this._updateDebounce(employee.id, action.label);

      // 7. Send Notification
      const flexMessage = attendanceSuccessMessage({
        actionLabel: action.label,
        time: currentTimeStr,
        date: todayStr,
      });
      await lineProvider.push(lineUserId, flexMessage);

      return { status: "success", action: action.label, time: currentTimeStr };
    } catch (error) {
      logger.error(`[Attendance] เกิดข้อผิดพลาดในการประมวลผล:`, error);
      return { status: "error", message: error.message };
    }
  }

  // =========================================================================
  // 4. ส่วนตรวจสอบการแจ้งเตือนอัจฉริยะ (Smart Notification Validation)
  // =========================================================================

  // ตรวจสอบว่าควรแจ้งเตือน Flex Message หรือไม่เมื่อเดินผ่าน Beacon
  async validateBeaconTrigger(lineUserId, hwid) {
    try {
      // 1. ตรวจสอบอุปกรณ์
      const device = await DevIOModel.findByHWID(hwid);
      if (!device) return null;

      // 2. ตรวจสอบพนักงาน
      const employee = await Employee.findActiveByLineUserId({
        where: { userId: lineUserId },
      });
      if (!employee || employee.companyId !== device.companyId) return null;

      // 3. ตรวจสอบสิทธิ์
      if (!this._isEmployeeAuthorizedForDevice(employee, device)) return null;

      // 4. ตรวจสอบกะและเวลา
      const now = dayjs();
      let todayStr = normalizeDate(now.toISOString());

      let workingTime = await WorkingTimeModel.findByEmployeeAndDate(
        employee.id,
        employee.companyId,
        todayStr
      );

      // [Night Shift Support]
      if (!workingTime && now.hour() < 6) {
        const yesterday = now.subtract(1, "day");
        const yesterdayStr = normalizeDate(yesterday.toISOString());
        const nightShift = await WorkingTimeModel.findByEmployeeAndDate(
          employee.id,
          employee.companyId,
          yesterdayStr,
          { onlyNightShift: true }
        );
        if (nightShift) {
          workingTime = nightShift;
          todayStr = yesterdayStr;
        }
      }

      if (!workingTime) return null;

      const timestamp = await TimestampRecord.findByEmployeeAndDate(
        employee.id,
        todayStr
      );

      // ใช้ Loginc หลักในการหา Action
      const action = await this.determineTimeAction(
        workingTime,
        now,
        timestamp,
        employee.id,
        employee.companyId
      );

      if (action.type === "NONE") return null;

      // ตรวจสอบเงื่อนไขเวลาสำหรับการแจ้งเตือน (Notification Window)
      return this._shouldNotifyForAction(
        workingTime,
        action,
        now,
        todayStr,
        device
      );
    } catch (error) {
      console.error("[Attendance] Error validating beacon trigger:", error);
      return null;
    }
  }

  // =========================================================================
  // 5. Business Logic: การกำหนด Action ตามช่วงเวลา (Time Determination)
  // =========================================================================

  // คำนวณว่าจะลงเวลาช่องไหน โดยใช้กฎเกณฑ์ที่กำหนด
  async determineTimeAction(wt, now, tr, employeeId, companyId) {
    // กรณี Free Time (ไม่มีกะตายตัว)
    if (wt.free_time) {
      return this._determineFreeTimeAction(tr);
    }

    const todayDate = normalizeDate(now.toISOString());
    const getDateTime = (timeStr) => {
      // ใช้ normalizeTime เพื่อให้มั่นใจ format HH:mm:ss (หากจำเป็น)
      // แต่ timeStr จาก DB ปกติจะเป็น string HH:mm:ss อยู่
      if (!timeStr) return null;
      return dayjs(`${todayDate} ${timeStr}`);
    };

    const breakStart = getDateTime(wt.break_start_time);
    const breakEnd = getDateTime(wt.break_end_time);
    const endTime = getDateTime(wt.end_time);

    // ตรวจสอบสถานะว่าลงเวลาช่องไหนไปแล้วบ้าง
    const hasStart = tr?.start_time;
    const hasBreakStart = tr?.break_start_time;
    const hasBreakEnd = tr?.break_end_time;
    const hasEnd = tr?.end_time;

    // 1. ช่วงเช้า (Start Window)
    if (!hasStart) {
      return this._determineMorningAction(
        now,
        breakStart,
        breakEnd,
        endTime,
        tr
      );
    }

    // [New] 3.1 Check is_break (Skip break logic if is_break = 0)
    if (wt.is_break === 0) {
      // ข้ามขั้นตอนการพัก ไปเช็คเวลาออกงานเลย
    } else {
      // 2. ช่วงพัก (Break Window)
      if (hasStart && !hasBreakStart) {
        return this._determineBreakAction(now, breakStart);
      }

      // 3. ช่วงบ่าย (Afternoon Window)
      if (hasBreakStart && !hasBreakEnd) {
        return this._determineAfternoonAction();
      }
    }

    // 4. ช่วงเลิกงาน (End Window)
    if (!hasEnd) {
      return this._determineEndAction(now, endTime);
    }

    // 5. ช่วง OT (OT Window)
    return await this._determineOTAction(tr, employeeId, companyId, now);
  }

  // =========================================================================
  // 6. Data Retrieval for Summary
  // =========================================================================

  // ดึงข้อมูลสรุปประจำวัน (Timestamp + Working Time)
  async getDailySummary(lineUserId) {
    try {
      const employee = await Employee.findActiveByLineUserId({
        where: { userId: lineUserId },
      });
      if (!employee) return null;

      const now = dayjs();
      const todayStr = normalizeDate(now.toISOString());

      const workingTime = await WorkingTimeModel.findByEmployeeAndDate(
        employee.id,
        employee.companyId,
        todayStr
      );

      const timestamp = await TimestampRecord.findByEmployeeAndDate(
        employee.id,
        todayStr
      );

      return { timestamp, workingTime, date: todayStr };
    } catch (error) {
      console.error("[Attendance] Error getting daily summary:", error);
      return null;
    }
  }
}

module.exports = new AttendanceService();
