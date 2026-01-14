const { Client } = require("@line/bot-sdk");
const axios = require("axios");
const config = require("../config/line.config");
const { Employee } = require("../../modules/models/employee.model");

class LineProvider {
  constructor() {
    this.client = new Client(config);
  }

  async showLoadingAnimation(chatId, loadingSeconds = 5) {
    try {
      await axios.post(
        "https://api.line.me/v2/bot/chat/loading/start",
        {
          chatId: chatId,
          loadingSeconds: loadingSeconds,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.channelAccessToken}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "Error showing loading animation:",
        error.response?.data || error.message
      );
    }
  }

  async replyOrPush(event, messages) {
    const { replyToken, source } = event;
    console.log("DEBUG: replyOrPush called");
    console.log("DEBUG: replyToken:", replyToken);
    console.log("DEBUG: source:", JSON.stringify(source));

    try {
      // ตรวจสอบว่า replyToken ถูกต้องหรือไม่
      if (replyToken && replyToken !== "00000000000000000000000000000000") {
        await this.reply(replyToken, messages);
      } else if (source?.userId) {
        // เพิ่ม fallback เป็นการส่งข้อความแบบ push หาก replyToken ไม่ถูกต้อง
        console.log("ReplyToken ไม่ถูกต้อง, กำลังส่งข้อความแบบ push แทน...");
        await this.push(source.userId, messages);
      } else {
        console.warn(
          "Cannot send message: Missing both replyToken and userId."
        );
      }
    } catch (error) {
      console.error("Error in replyOrPush:", error.message);
    }
  }

  async checkMemberStatus(source) {
    if (!source?.userId) return;
    const member = await Employee.findActiveByLineUserId({
      where: { userId: source.userId },
    });
    if (member) {
      // หากเป็นสมาชิกที่ยังใช้งานอยู่ ให้ Link Rich Menu สำหรับสมาชิก
      try {
        await this.linkRichMenu(
          source.userId,
          "richmenu-b47531b4ce876ba726b12e8f196b028b"
        );
        console.log(
          `เชื่อมต่อ Rich Menu สำหรับสมาชิกกับผู้ใช้ ${source.userId} เรียบร้อยแล้ว`
        );
      } catch (error) {
        console.error(
          `ไม่สามารถเชื่อมต่อ Rich Menu กับผู้ใช้ ${source.userId} ได้:`,
          error
        );
      }
    } else {
      // หากไม่ใช่สมาชิกที่ยังใช้งานอยู่ ให้ Unlink Rich Menu สำหรับสมาชิก
      try {
        await this.unlinkRichMenu(source.userId);
        console.log(
          `ยกเลิกการเชื่อมต่อ Rich Menu สำหรับสมาชิกกับผู้ใช้ ${source.userId} เรียบร้อยแล้ว`
        );
      } catch (error) {
        console.error(
          `ไม่สามารถยกเลิกการเชื่อมต่อ Rich Menu กับผู้ใช้ ${source.userId} ได้:`,
          error
        );
      }
    }
  }

  async reply(replyToken, messages) {
    return await this.client.replyMessage(replyToken, messages);
  }

  async push(to, messages) {
    return await this.client.pushMessage(to, messages);
  }

  async linkRichMenu(userId, richMenuId) {
    return await this.client.linkRichMenuToUser(userId, richMenuId);
  }

  async unlinkRichMenu(userId) {
    return await this.client.unlinkRichMenuFromUser(userId);
  }
}

module.exports = new LineProvider();
