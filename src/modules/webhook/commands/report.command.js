const lineProvider = require("../../../shared/providers/line.provider");
const reportService = require("../../services/report.service");
const {
  attendanceReport,
} = require("../../../shared/templates/attendance.flex");

class ReportCommand {
  // ==============================================================
  //        ส่วนของฟังก์ชันหลัก (Main Functions)
  // ==============================================================

  // ฟังก์ชันสำหรับจัดการคำสั่ง "สรุปประวัติ"
  async handle(event) {
    const userId = event?.source?.userId;
    if (!userId) {
      return lineProvider.replyOrPush(event, {
        type: "text",
        text: "Employee Unauthorized",
      });
    }
    // เรียกใช้บริการเพื่อดึงข้อมูลรายงานการลงเวลา
    const reportData = await reportService.generateMonthlyReport(userId);
    // สร้างข้อความสรุปรายงานการลงเวลา
    const reportMessage = attendanceReport(reportData);
    // ส่งข้อความสรุปรายงานการลงเวลาให้กับผู้ใช้
    return lineProvider.replyOrPush(event, reportMessage);
  }
}

module.exports = new ReportCommand();
