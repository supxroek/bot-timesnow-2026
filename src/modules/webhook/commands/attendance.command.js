const lineProvider = require("../../../shared/providers/line.provider");
const AttendanceService = require("../../services/attendance.service");
const {
  beaconNotFoundFlex,
  noShiftFlex,
} = require("../../../shared/templates/flex/modules/error.flex");
const {
  attendanceSuccessMessage, attendanceStatusMessage,
} = require("../../../shared/templates/flex/modules/attendance.flex");

class AttendanceCommand {
  // ฟังก์ชันสำหรับจัดการคำสั่ง "ลงเวลา"
  async handle(event) {
    // เรียกใช้บริการเพื่อลงเวลาด้วยตนเอง
    const result = await AttendanceService.processManualAttendance(
      event.source.userId
    );

    // ตรวจสอบผลลัพธ์และตอบกลับตามสถานะ
    if (result.status === "error") {
      // หากมีข้อผิดพลาด ให้ส่งข้อความแจ้งเตือนตามประเภทของข้อผิดพลาด
      switch (result.message) {
        // หากพบข้อผิดพลาดที่เกี่ยวกับบีคอน
        case "Beacon Expired or Not Found":
          await lineProvider.replyOrPush(event, beaconNotFoundFlex());
          break;

        // กรณีข้อผิดพลาดเกี่ยวกับสิทธิ์การใช้งานอุปกรณ์หรือพนักงาน
        case "Device Authorization Failed":
        case "Employee Unauthorized":
          await lineProvider.replyOrPush(event, {
            type: "text",
            text: "⛔ คุณไม่มีสิทธิ์ใช้งานจุดลงเวลานี้ หรือข้อมูลพนักงานไม่ถูกต้อง กรุณาติดต่อฝ่ายบุคคล",
          });
          break;

        // กรณีไม่พบข้อมูลอุปกรณ์
        case "Unknown Device":
          await lineProvider.replyOrPush(event, {
            type: "text",
            text: "⚠️ ไม่พบข้อมูลอุปกรณ์ในระบบ",
          });
          break;

        // กรณีไม่พบกะการทำงาน
        case "No Shift Found":
          await lineProvider.replyOrPush(event, noShiftFlex());
          break;

        // กรณีข้อผิดพลาดทั่วไปอื่นๆ
        default:
          await lineProvider.replyOrPush(event, {
            type: "text",
            text: `❌ เกิดข้อผิดพลาด: ${result.message}`,
          });
          break;
      }
    } else if (result.status === "info" && result.data) {
      // 2.2 Duplicate Punch Handling
      // หากสถานะเป็น info และมีข้อมูลกลับมา (หมายถึงบันทึกไปแล้วแต่อยู่ในช่วงเวลาเดิม)
      // ให้ส่งสรุปเวลาทำงานกลับไปแทนการเงียบหาย พร้อมระบุว่าเป็นการลงเวลาซ้ำ
      const lastAction = result.data.latestAction || {
        label: "การลงเวลา",
        time: null,
      };

      await lineProvider.replyOrPush(
        event,
        attendanceSuccessMessage({
          actionLabel: lastAction.label,
          time: lastAction.time,
          date: result.data.date,
          isDuplicate: true,
        })
      );
    }
    // กรณี success จะมี Push message จาก service อยู่แล้ว
  }

  // ฟงัก์ชันสำหรับจัดการคำสั่ง "สถานะวันนี้"
  async statusToday(event) {
    // เรียกใช้บริการเพื่อนำข้อมูลสรุปเวลาทำงานวันนี้
    const data = await AttendanceService.getDailySummary(event.source.userId);
    if (data?.workingTime) {
      await lineProvider.replyOrPush(
        event,
        attendanceStatusMessage({
          timestamp: data.timestamp,
          workingTime: data.workingTime,
          date: data.date,
        })
      );
    } else {
      await lineProvider.replyOrPush(event, {
        type: "text",
        text: "ไม่พบข้อมูลกะการทำงานสำหรับวันนี้ หรือคุณยังไม่ได้ลงทะเบียน",
      });
    }
  }
}

module.exports = new AttendanceCommand();
