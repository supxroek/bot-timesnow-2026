const { Client } = require("@line/bot-sdk");
const axios = require("axios");
const config = require("../config/line.config");

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
