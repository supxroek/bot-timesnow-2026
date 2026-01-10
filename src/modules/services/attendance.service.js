const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
const isBetween = require("dayjs/plugin/isBetween");
dayjs.extend(duration);
dayjs.extend(isBetween);

const { normalizeDate, normalizeTime } = require("../../shared/utils/date");
const DevIOModel = require("../models/devIO.model");
const { Employee } = require("../models/employee.model");
const WorkingTimeModel = require("../models/workingTime.model");
const { TimestampRecord } = require("../models/timestamp.model");
const lineProvider = require("../../shared/providers/line.provider");

class AttendanceService {
  constructor() {
    this.beaconState = new Map(); // เก็บสถานะ Beacon { userId: { hwid, timestamp } }
  }

  // =========================================================================
  // 1. ส่วนจัดการสถานะ Beacon (Beacon State Management)
  // =========================================================================

  updateBeaconState(userId, hwid) {
    console.log(
      `[Attendance] อัปเดตสถานะ Beacon สำหรับ User: ${userId}, HWID: ${hwid}`
    );
    this.beaconState.set(userId, {
      hwid,
      timestamp: dayjs(),
    });
    console.log(
      `[Attendance] จำนวน Beacon State ปัจจุบัน: ${this.beaconState.size}`
    );
  }

  // =========================================================================
  // 2. ส่วนประมวลผลหลัก (Main Processing)
  // =========================================================================

  /**
   * ตรวจสอบการลงเวลาด้วยตัวเอง (Manual Check via Menu)
   * ใช้ข้อมูล State จาก Beacon ล่าสุด
   */
  async processManualAttendance(userId) {
    const state = this.beaconState.get(userId);

    console.log(`[Attendance] ตรวจสอบ Manual Check สำหรับ User: ${userId}`);
    console.log(
      `[Attendance] Beacon State:`,
      state ? JSON.stringify(state) : "undefined"
    );

    // ตรวจสอบว่ามี State หรือไม่ และหมดอายุหรือยัง (> 10 นาที)
    if (!state) {
      console.warn(`[Attendance] ไม่พบ Beacon State สำหรับ User ${userId}`);
      return { status: "error", message: "Beacon Expired or Not Found" };
    }

    if (dayjs().diff(state.timestamp, "minute") > 10) {
      console.log(`[Attendance] Beacon State หมดอายุสำหรับ ${userId}`);
      this.beaconState.delete(userId);
      return { status: "error", message: "Beacon Expired or Not Found" };
    }

    // เรียกใช้ตรรกะเดียวกับ Beacon Event
    return await this.processBeaconAttendance(userId, state.hwid);
  }

  /**
   * ประมวลผลการบันทึกเวลา (Core Logic)
   * @param {string} lineUserId
   * @param {string} hwid
   */
  async processBeaconAttendance(lineUserId, hwid) {
    try {
      console.log(
        `[Attendance] กำลังประมวลผล Beacon สำหรับ ${lineUserId} HWID: ${hwid}`
      );

      // 1. ตรวจสอบอุปกรณ์ DevIO
      const device = await DevIOModel.findByHWID(hwid);
      if (!device) {
        console.warn(`[Attendance] ไม่พบอุปกรณ์ HWID: ${hwid}`);
        return { status: "error", message: "Unknown Device" };
      }

      // 2. ตรวจสอบข้อมูลพนักงานจาก Line User ID
      const employee = await Employee.findActiveByLineUserId({
        where: { userId: lineUserId },
      });
      if (!employee) {
        console.warn(
          `[Attendance] ไม่พบพนักงานสำหรับ LineUserID: ${lineUserId}`
        );
        return { status: "error", message: "Employee Unauthorized" };
      }

      // ตรวจสอบสังกัดบริษัท
      if (employee.companyId !== device.companyId) {
        console.warn(
          `[Attendance] บริษัทไม่ตรงกัน Employee: ${employee.companyId}, Device: ${device.companyId}`
        );
        return { status: "error", message: "Employee Unauthorized" };
      }

      // 3. ตรวจสอบสิทธิ์การใช้อุปกรณ์
      if (!this.isEmployeeAuthorizedForDevice(employee, device)) {
        console.warn(
          `[Attendance] พนักงาน ${employee.id} ไม่มีสิทธิ์ใช้งานอุปกรณ์ ${device.name}`
        );
        return { status: "error", message: "Device Authorization Failed" };
      }

      // เตรียมข้อมูลเวลาปัจจุบัน
      const now = dayjs();
      const todayStr = normalizeDate(now.toISOString());
      const currentTimeStr = normalizeTime(now.format("HH:mm:ss"));

      // 4. ดึงข้อมูลกะการทำงาน (Working Time)
      // ใช้ normalizeDate เพื่อความถูกต้องของฟอร์แมตวันที่
      let workingTime = await WorkingTimeModel.findByEmployeeAndDate(
        employee.id,
        employee.companyId,
        todayStr
      );

      if (!workingTime) {
        console.warn(
          `[Attendance] ไม่พบกะการทำงานสำหรับพนักงาน ${employee.id} วันที่ ${todayStr}`
        );
        return {
          status: "error",
          message: "No Shift Found",
          detail: "Please contact HR to assign a shift.",
        };
      }

      // 5. ตรวจสอบประวัติการลงเวลาที่มีอยู่ (Timestamp Record)
      let timestamp = await TimestampRecord.findByEmployeeAndDate(
        employee.id,
        todayStr
      );

      // 6. คำนวณ action ที่ควรทำ (Start, Break, End, OT)
      const action = this.determineTimeAction(workingTime, now, timestamp);

      if (action.type === "NONE") {
        return {
          status: "info",
          message: "No action needed",
          detail: action.reason,
        };
      }

      // 7. บันทึกข้อมูลลงฐานข้อมูล
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

      // 8. แจ้งเตือนผู้ใช้เมื่อสำเร็จ
      const message = `บันทึกเวลาสำเร็จ: ${action.label} เวลา ${currentTimeStr}`;
      await lineProvider.push(lineUserId, { type: "text", text: message });

      return { status: "success", action: action.label, time: currentTimeStr };
    } catch (error) {
      console.error("[Attendance] เกิดข้อผิดพลาดในการประมวลผล:", error);
      return { status: "error", message: error.message };
    }
  }

  // =========================================================================
  // 3. ส่วนตรวจสอบการแจ้งเตือนอัจฉริยะ (Smart Notification Validation)
  // =========================================================================

  /**
   * ตรวจสอบว่าควรแจ้งเตือน Flex Message หรือไม่เมื่อเดินผ่าน Beacon
   */
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
      if (!this.isEmployeeAuthorizedForDevice(employee, device)) return null;

      // 4. ตรวจสอบกะและเวลา
      const now = dayjs();
      const todayStr = normalizeDate(now.toISOString());

      const workingTime = await WorkingTimeModel.findByEmployeeAndDate(
        employee.id,
        employee.companyId,
        todayStr
      );
      if (!workingTime) return null;

      const timestamp = await TimestampRecord.findByEmployeeAndDate(
        employee.id,
        todayStr
      );

      // ใช้ Loginc หลักในการหา Action
      const action = this.determineTimeAction(workingTime, now, timestamp);

      if (action.type === "NONE") return null;

      // ตรวจสอบเงื่อนไขเวลาสำหรับการแจ้งเตือน (Notification Window)
      return this.shouldNotifyForAction(
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
  // 4. Helper Methods (ฟังก์ชันช่วยทำงาน)
  // =========================================================================

  isEmployeeAuthorizedForDevice(employee, device) {
    if (!device.employeeId || device.employeeId === "all") return true;

    // แปลง JSON String หรือ CSV เป็น Array IDs
    const cleanEmployeeIds = String(device.employeeId).replaceAll(
      /[\\[\]"]/g,
      ""
    );
    const allowedIds = cleanEmployeeIds.split(",").map((id) => id.trim());
    return allowedIds.includes(String(employee.id));
  }

  shouldNotifyForAction(workingTime, action, now, todayStr, device) {
    const targetTimeStr = this.getTargetTimeForAction(
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

  getTargetTimeForAction(wt, field) {
    if (!wt) return null;
    return wt[field];
  }

  // =========================================================================
  // 5. Business Logic: การกำหนด Action ตามช่วงเวลา (Time Determination)
  // =========================================================================

  /**
   * คำนวณว่าจะลงเวลาช่องไหน โดยใช้กฎเกณฑ์ที่กำหนด
   */
  determineTimeAction(wt, now, tr) {
    // กรณี Free Time (ไม่มีกะตายตัว)
    if (wt.free_time) {
      return this.determineFreeTimeAction(tr);
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

    // 2. ช่วงพัก (Break Window)
    if (hasStart && !hasBreakStart) {
      return this._determineBreakAction(now, breakStart);
    }

    // 3. ช่วงบ่าย (Afternoon Window)
    if (hasBreakStart && !hasBreakEnd) {
      return this._determineAfternoonAction(now, breakEnd);
    }

    // 4. ช่วงเลิกงาน (End Window)
    if (!hasEnd) {
      return this._determineEndAction(now, endTime);
    }

    // 5. ช่วง OT (OT Window)
    return this._determineOTAction(tr);
  }

  // --- Logic ย่อย ---

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

  _determineAfternoonAction(now, breakEnd) {
    // กฎข้อ 3: สิ้นสุดพัก ลงก่อนเวลาที่กะระบุได้ (อยู่ในช่วงพัก)
    // แต่ต้องระวังสับสนกับกฎ "ถ้าเกินจะถือว่าสาย"
    // ถ้าตอนนี้ < Break End (ยังไม่หมดเวลาพัก) -> ลงได้ (กลับก่อน)
    // ถ้าตอนนี้ > Break End (หมดเวลาพักแล้ว) -> ลงได้ (กลับสาย)
    // ตรงนี้แค่ Return Action การตรวจสอบสายจะทำตอนคำนวณ Report
    return { type: "UPDATE", field: "break_end_time", label: "กลับจากพัก" };
  }

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

  _determineOTAction(tr) {
    const hasOTStart = tr?.ot_start_time;
    const hasOTEnd = tr?.ot_end_time;

    // ง่ายๆ: จบงานปกติ -> เริ่ม OT -> จบ OT
    if (!hasOTStart) {
      return { type: "UPDATE", field: "ot_start_time", label: "เริ่ม OT" };
    }

    if (!hasOTEnd) {
      return { type: "UPDATE", field: "ot_end_time", label: "จบ OT" };
    }

    return { type: "NONE", reason: "บันทึกครบทุกช่องแล้ว" };
  }

  determineFreeTimeAction(tr) {
    if (!tr) {
      return { type: "INSERT", field: "start_time", label: "เข้างาน" };
    }
    if (!tr.end_time) {
      return { type: "UPDATE", field: "end_time", label: "เลิกงาน" };
    }
    return { type: "UPDATE", field: "end_time", label: "เลิกงาน(อัปเดต)" };
  }
}

module.exports = new AttendanceService();
