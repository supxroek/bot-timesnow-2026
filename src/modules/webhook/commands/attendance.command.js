const lineProvider = require("../../../shared/providers/line.provider");
const AttendanceService = require("../../services/attendance.service");
const {
  beaconNotFoundFlex,
  noShiftFlex,
} = require("../../../shared/templates/flex/modules/error.flex");

class AttendanceCommand {
  // ฟังก์ชันสำหรับจัดการคำสั่งลงเวลา
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
    }

    // กรณีสำเร็จ processBeaconAttendance จะยิง Push Message แจ้งเตือนเองแล้ว
  }
}

module.exports = new AttendanceCommand();
