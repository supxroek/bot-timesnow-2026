// src/modules/webhook/events.handler.js

// Import providers
const lineProvider = require("../../shared/providers/line.provider");
const AttendanceCommand = require("./commands/attendance.command");
const BeaconCommand = require("./commands/beacon.command");
const {
  greetingFlex,
  welcomeNewUserFlex,
  unknownCommandFlex,
} = require("../../shared/templates/flex/modules/greeting.flex");

// ============================================================
// Intents Configuration
// ============================================================
const INTENT_HANDLERS = {
  GREETING: {
    keywords: ["hello", "hi", "hey", "สวัสดี", "หวัดดี", "ดีจ้า", "ดีครับ"],
    execute: async (event) => lineProvider.replyOrPush(event, greetingFlex()),
  },
  REGISTRATION: {
    keywords: ["register", "sign up", "สมัคร", "ลงทะเบียน"],
    execute: async (event) =>
      lineProvider.replyOrPush(event, {
        type: "text",
        text: "หากต้องการลงทะเบียน กรุณาเยี่ยมชมหน้าลงทะเบียนของเราที่ [ลิงก์]",
      }),
  },
  ATTENDANCE: {
    keywords: [
      "ot in","check in","break in","break out","check out","ot out",
      "บันทึกเวลา","บันทึกเวลาเข้า","บันทึกเวลาออก","บันทึกเวลาพักเบรค","บันทึกเวลาเลิกพักเบรค","บันทึกเวลา OT เข้า","บันทึกเวลา OT ออก",
    ],
    execute: async (event) => AttendanceCommand.handle(event),
  },
  FORGOT_ATTENDANCE: {
    keywords: [
      "forgot attendance","แจ้งลืมลงเวลา",
    ],
    execute: async (event) =>
      lineProvider.replyOrPush(event, {
        type: "text",
        text: "หากคุณลืมบันทึกเวลาทำงาน กรุณาติดต่อฝ่ายบุคคลเพื่อขอความช่วยเหลือครับ/ค่ะ",
      }),
  },
  STATUS_TODAY: {
    keywords: [
      "status","สรุปสถานะวันนี้","เช็คสถานะวันนี้","ดูสถานะวันนี้",
    ],
    execute: async (event) => AttendanceCommand.statusToday(event),
  },
  HISTORY_ATTENDANCE: {
    keywords: [
      "history","ประวัติการลงเวลา","ดูประวัติย้อนหลัง","เช็คประวัติย้อนหลัง",
    ],
    execute: async (event) =>
      lineProvider.replyOrPush(event, {
        type: "text",
        text: "คุณสามารถดูประวัติการลงเวลาของคุณได้ที่ [ลิงก์]",
      }),
  },
};

// ============================================================
// EventsHandler Class
// ============================================================
class EventsHandler {
  /**
   * Main entry point for message events
   * @param {Object} event
   */
  // ===========================================================
  // ฟังก์ชันสำหรับจัดการข้อความประเภทข้อความ
  async handleMessage(event) {
    const { message, source } = event;

    // การเตรียมข้อมูลล่วงหน้า: แสดงการโหลดและตรวจสอบสถานะสมาชิก
    if (source?.userId) {
      await lineProvider.showLoadingAnimation(source.userId);
      await lineProvider.checkMemberStatus(source);
    }

    // ตัวจัดการตามประเภทข้อความ
    switch (message.type) {
      case "text":
        // จัดการข้อความประเภทข้อความ
        await this._handleTextMessage(event);
        break;
      case "sticker":
        await lineProvider.replyOrPush(event, {
          type: "text",
          text: "ขอบคุณสำหรับสติกเกอร์นะครับ/ค่ะ! 😊",
        });
        break;
      default:
        await lineProvider.replyOrPush(event, {
          type: "text",
          text: "ขออภัยครับ/ค่ะ ตอนนี้ฉันสามารถจัดการข้อความประเภทข้อความเท่านั้น",
        });
    }
  }

  /**
   * Handle Follow event (Block/Unblock)
   * @param {Object} event
   */
  // ===========================================================
  // ฟังก์ชันสำหรับจัดการเหตุการณ์ติดตาม (Follow)
  async handleFollow(event) {
    const { source } = event;
    try {
      // ส่งข้อความต้อนรับผู้ใช้ใหม่
      await lineProvider.replyOrPush(event, welcomeNewUserFlex());
    } catch (error) {
      console.error("Failed to send flex message:", error.message);
      await lineProvider.replyOrPush(event, {
        type: "text",
        text: `ยินดีต้อนรับ ${
          source.userId ? "ผู้ใช้ที่รัก" : "ทุกคน"
        }! ขอบคุณที่ติดตามบอทของเรา พิมพ์ 'สวัสดี' เพื่อเริ่มต้นการสนทนา!`,
      });
    }
  }

  /**
   * Handle Beacon event
   * @param {Object} event
   */
  // ===========================================================
  // ฟังก์ชันสำหรับจัดการเหตุการณ์บีคอน (Beacon)
  async handleBeacon(event) {
    // ใช้ BeaconCommand ในการจัดการเหตุการณ์บีคอน
    await BeaconCommand.handle(event);
  }

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------

  // ฟังก์ชันสำหรับจัดการข้อความประเภทข้อความ
  async _handleTextMessage(event) {
    const text = event.message.text;
    const handler = this._matchIntent(text);

    if (handler) {
      await handler.execute(event);
    } else {
      // กรณีไม่พบเจตนา (intent) ที่ตรงกัน
      await lineProvider.replyOrPush(event, unknownCommandFlex(text));
    }
  }

  // ฟังก์ชันสำหรับจับคู่ข้อความกับเจตนา (intent) ที่กำหนดไว้
  _matchIntent(text) {
    const lowerText = text.toLowerCase();
    // วนลูปผ่านเจตนา (intent) ทั้งหมดเพื่อหาคำที่ตรงกัน
    for (const key in INTENT_HANDLERS) {
      const intent = INTENT_HANDLERS[key];
      if (intent.keywords.some((keyword) => lowerText.includes(keyword))) {
        return intent;
      }
    }
    return null;
  }
}

module.exports = new EventsHandler();
