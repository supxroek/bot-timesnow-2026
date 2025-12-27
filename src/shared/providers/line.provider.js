const { Client } = require("@line/bot-sdk");

const config = require("../config/line.config");

class LineProvider {
  constructor() {
    this.client = new Client(config);
  }

  async reply(replyToken, messages) {
    return await this.client.replyMessage(replyToken, messages);
  }

  async push(to, messages) {
    return await this.client.pushMessage(to, messages);
  }
}

module.exports = new LineProvider();
