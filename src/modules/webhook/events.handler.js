// src/modules/webhook/handlers/events.handler.js

// import providers
const lineProvider = require("../../shared/providers/line.provider");
const {
  greetingFlex,
  welcomeNewUserFlex,
  unknownCommandFlex,
} = require("../../shared/templates/flex/modules/greeting.flex");

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

  // ฟังก์ชันสำหรับตอบกลับหรือส่งข้อความ (reply or push)
  async replyOrPush(event, messages) {
    const { replyToken, source } = event;
    try {
      // ตรวจสอบว่า replyToken ถูกต้องหรือไม่
      if (replyToken && replyToken !== "00000000000000000000000000000000") {
        await lineProvider.reply(replyToken, messages);
      } else if (source?.userId) {
        // เพิ่ม fallback เป็นการส่งข้อความแบบ push หาก replyToken ไม่ถูกต้อง
        console.log("ReplyToken ไม่ถูกต้อง, กำลังส่งข้อความแบบ push แทน...");
        await lineProvider.push(source.userId, messages);
      } else {
        console.warn(
          "Cannot send message: Missing both replyToken and userId."
        );
      }
    } catch (error) {
      console.error("Error in replyOrPush:", error.message);
    }
  }

  // ฟังก์ชันจัดการ events สำหรับ message
  async handleMessage(event) {
    const { message } = event;

    if (message.type === "text") {
      const text = message.text;
      const intent = this.detectIntent(text);
      let replyMessage;

      // ตอบกลับตามเจตนาที่ตรวจพบ
      switch (intent) {
        case "GREETING":
          replyMessage = greetingFlex();
          break;
        case "HELP":
          replyMessage = {
            type: "text",
            text: "แน่นอนครับ/ค่ะ! ฉันสามารถช่วยอะไรคุณได้บ้างวันนี้?",
          };
          break;
        case "THANKS":
          replyMessage = {
            type: "text",
            text: "ยินดีครับ/ค่ะ! 😊",
          };
          break;
        case "REGISTERATION":
          replyMessage = {
            type: "text",
            text: "หากต้องการลงทะเบียน กรุณาเยี่ยมชมหน้าลงทะเบียนของเราที่ [ลิงก์]",
          };
          break;
        case "ATTENDANCE_IN":
          replyMessage = {
            type: "text",
            text: "คุณสามารถเช็คอินโดยใช้ระบบหรืแอปพลิเคชันบันทึกเวลาทำงานของเราได้ครับ/ค่ะ",
          };
          break;
        case "ATTENDANCE_OUT":
          replyMessage = {
            type: "text",
            text: "คุณสามารถเช็คเอาท์โดยใช้ระบบเดียวกับที่ใช้เช็คอินได้ครับ/ค่ะ",
          };
          break;
        case "FORGOT_ATTENDANCE":
          replyMessage = {
            type: "text",
            text: "หากคุณลืมบันทึกเวลาทำงาน กรุณาติดต่อฝ่ายบุคคลเพื่อขอความช่วยเหลือครับ/ค่ะ",
          };
          break;
        case "WORK_CALCULATION":
          replyMessage = {
            type: "text",
            text: "คุณสามารถคำนวณชั่วโมงทำงานของคุณได้โดยใช้เครื่องมือคำนวณออนไลน์ของเราที่ [ลิงก์]",
          };
          break;
        default:
          replyMessage = unknownCommandFlex(text);
      }

      if (replyMessage) {
        await this.replyOrPush(event, replyMessage);
      }
    } else if (message.type === "sticker") {
      await this.replyOrPush(event, {
        type: "text",
        text: "ขอบคุณสำหรับสติกเกอร์นะครับ/ค่ะ! 😊",
      });
    } else {
      await this.replyOrPush(event, {
        type: "text",
        text: "ขออภัยครับ/ค่ะ ตอนนี้ฉันสามารถจัดการข้อความประเภทข้อความเท่านั้น",
      });
    }
  }

  // ฟังก์ชันจัดการ events สำหรับ follow
  async handleFollow(event) {
    const { source } = event;
    try {
      await this.replyOrPush(event, welcomeNewUserFlex());
    } catch (error) {
      console.error("Failed to send flex message:", error.message);
      const textWelcomeMessage = {
        type: "text",
        text: `ยินดีต้อนรับ ${
          source.userId ? "ผู้ใช้ที่รัก" : "ทุกคน"
        }! ขอบคุณที่ติดตามบอทของเรา พิมพ์ 'สวัสดี' เพื่อเริ่มต้นการสนทนา!`,
      };
      await this.replyOrPush(event, textWelcomeMessage);
    }
  }

  // ฟังก์ชันจัดการ events สำหรับ beacon
  async handleBeacon(event) {
    const { beacon } = event;

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

    await this.replyOrPush(event, replyMessage);
  }
}

module.exports = new EventsHandler();
