// src/modules/webhook/handlers/events.handler.js

// import providers
const lineProvider = require("../../../shared/providers/line.provider");

// intents keywords
const INTENTS = {
  // General greetings and common phrases - สำหรับคำทักทายทั่วไปและวลีที่ใช้บ่อย
  GREETING: ["hello", "hi", "hey", "สวัสดี", "หวัดดี", "ดีจ้า", "ดีครับ"],
  HELP: ["help", "support", "ช่วยเหลือ", "ช่วยด้วย"],
  THANKS: ["thank", "thanks", "appreciate", "ขอบคุณ", "ขอบใจ"],

  // Specific service inquiries - สำหรับการสอบถามบริการเฉพาะ
  REGISTERATION: ["register", "sign up", "สมัคร", "ลงทะเบียน"],
  ATTENDANCE_IN: ["check in", "attendance in", "เช็คอิน", "ลงชื่อเข้าใช้", "เข้างาน", "บันทึกเวลาเข้างาน"],
  ATTENDANCE_OUT: ["check out", "attendance out", "เช็คเอาท์", "ลงชื่อออก", "ออกงาน", "บันทึกเวลาออกงาน"],
  FORGOT_ATTENDANCE: ["forgot attendance", "ลืมบันทึกเวลา", "ลืมเช็คอิน", "ลืมเช็คเอาท์"],
  WORK_CALCULATION: ["work hours", "calculate work", "คำนวณชั่วโมงทำงาน", "คำนวณเวลางาน"],
};

// คลาสสำหรับจัดการ events ต่าง ๆ
class EventsHandler {
  // ฟังก์ชันตรวจสอบเจตนา (intent) จากข้อความ
  detectIntent(text) {
    const lowerText = text.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENTS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return intent;
        }
      }
    }
    return null; // หากไม่พบเจตนาใด ๆ
  }

  // ฟังก์ชันจัดการ events สำหรับ message
  async handleMessage(event) {
    const { message, replyToken } = event;

    if (message.type === "text") {
      const text = message.text;
      const intent = this.detectIntent(text);
      // ตอบกลับตามเจตนาที่ตรวจพบ
      switch (intent) {
        case "GREETING":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "สวัสดีครับ/ค่ะ! มีอะไรให้ช่วยไหมครับ/ค่ะ?",
          });
          break;
        case "HELP":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "แน่นอนครับ/ค่ะ! ฉันสามารถช่วยอะไรคุณได้บ้างวันนี้?",
          });
          break;
        case "THANKS":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "ยินดีครับ/ค่ะ! 😊",
          });
          break;
        case "REGISTERATION":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "หากต้องการลงทะเบียน กรุณาเยี่ยมชมหน้าลงทะเบียนของเราที่ [ลิงก์]",
          });
          break;
        case "ATTENDANCE_IN":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "คุณสามารถเช็คอินโดยใช้ระบบหรืแอปพลิเคชันบันทึกเวลาทำงานของเราได้ครับ/ค่ะ",
          });
          break;
        case "ATTENDANCE_OUT":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "คุณสามารถเช็คเอาท์โดยใช้ระบบเดียวกับที่ใช้เช็คอินได้ครับ/ค่ะ",
          });
          break;
        case "FORGOT_ATTENDANCE":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "หากคุณลืมบันทึกเวลาทำงาน กรุณาติดต่อฝ่ายบุคคลเพื่อขอความช่วยเหลือครับ/ค่ะ",
          });
          break;
        case "WORK_CALCULATION":
          await lineProvider.reply(replyToken, {
            type: "text",
            text: "คุณสามารถคำนวณชั่วโมงทำงานของคุณได้โดยใช้เครื่องมือคำนวณออนไลน์ของเราที่ [ลิงก์]",
          });
          break;
        default:
          await lineProvider.reply(replyToken, {
            type: "text",
            text: `ขอโทษครับ/ค่ะ คำถามของคุณ "${message.text}" ไม่อยู่ในขอบเขตที่ฉันสามารถช่วยได้ในตอนนี้ 🙂`,
          });
      }
    } else if (message.type === "sticker") {
      await lineProvider.reply(replyToken, {
        type: "text",
        text: "ขอบคุณสำหรับสติกเกอร์นะครับ/ค่ะ! 😊",
      });
    } else {
      await lineProvider.reply(replyToken, {
        type: "text",
        text: "ขออภัยครับ/ค่ะ ตอนนี้ฉันสามารถจัดการข้อความประเภทข้อความเท่านั้น",
      });
    }
  }

  // ฟังก์ชันจัดการ events สำหรับ follow
  async handleFollow(event) {
    const { replyToken, source } = event;

    // Welcome message when user follows the bot
    const welcomeMessage = {
      type: "text",
      text: `ยินดีต้อนรับ ${
        source.userId ? "ผู้ใช้ที่รัก" : "ทุกคน"
      }! ขอบคุณที่ติดตามบอทของเรา พิมพ์ 'สวัสดี' เพื่อเริ่มต้นการสนทนา!`,
    };

    await lineProvider.reply(replyToken, welcomeMessage);
  }

  // ฟังก์ชันจัดการ events สำหรับ beacon
  async handleBeacon(event) {
    const { replyToken, beacon } = event;

    // Log beacon information
    console.log("Beacon event received:", {
      type: beacon.type,
      hwid: beacon.hwid,
      deviceMessage: beacon.deviceMessage,
    });

    // Reply to acknowledge beacon detection
    const replyMessage = {
      type: "text",
      text: `Beacon detected! Type: ${beacon.type}, HWID: ${beacon.hwid}`,
    };

    await lineProvider.reply(replyToken, replyMessage);
  }
}

module.exports = new EventsHandler();
