// src/modules/webhook/handlers/commands/register.command.js
// สำหรับจัดการคำสั่งลงทะเบียนสมาชิกใหม่ เช่น "สมัครสมาชิก", "register me" เป็นต้น
// จัดการการตอบกลับเมื่อผู้ใช้ส่งคำสั่งลงทะเบียนผ่านแชท เช่น ลงทะเบียนแล้วหรือไม่ เป็นต้น

const lineProvider = require("../../../../shared/providers/line.provider");
const { registerService } = require("../../../services/liff.service");
const {
  welcomeNewUserFlex,
} = require("../../../../shared/templates/flex/modules/greeting.flex");
const AppError = require("../../../../shared/utils/AppError");

// Class สำหรับจัดการคำสั่งลงทะเบียนสมาชิก
class RegisterCommandHandler {
  // ฟังก์ชันสำหรับจัดการคำสั่งลงทะเบียน
  async handle(event, params) {
    const lineUserId = event.source.userId;
    const { name, IDCard, companyId, start_date } = params;
    if (!name || !IDCard || !companyId || !start_date) {
      throw new AppError("ข้อมูลไม่ครบถ้วนสำหรับการลงทะเบียน", 400);
    }
    // เรียกใช้บริการลงทะเบียนสมาชิก
    await registerService({
      name,
      IDCard,
      companyId,
      lineUserId,
      start_date,
    });
    // ส่งข้อความต้อนรับสมาชิกใหม่
    const welcomeFlex = welcomeNewUserFlex(name);
    await lineProvider.replyMessage(event.replyToken, welcomeFlex);
  }

  // ฟังก์ชันสำหรับดึงคำสั่งที่รองรับ
  getSupportedCommands() {
    return ["สมัครสมาชิก", "register me", "register"];
  }
}

// ส่งออกคลาส RegisterCommandHandler
module.exports = new RegisterCommandHandler();
