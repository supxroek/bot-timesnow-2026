// src/modules/webhook/webhook.js

const catchAsync = require("../../shared/utils/catchAsync");
const eventHandlers = require("./events.handler");

class Webhook {
  // ฟังก์ชันสำหรับจัดการ webhook events จาก LINE
  handleEvent(req, res, next) {
    return catchAsync(async () => {
      const events = req.body.events;

      for (const event of events) {
        switch (event.type) {
          case "message":
            await eventHandlers.handleMessage(event);
            break;
          case "follow":
            await eventHandlers.handleFollow(event);
            break;
          // case "beacon":
          //   await eventHandlers.handleBeacon(event);
          //   break;
          default:
            console.log("Unhandled event type:", event.type);
        }
      }

      res.status(200).json({ message: "Events processed" });
    })(req, res, next);
  }
}

module.exports = new Webhook();
