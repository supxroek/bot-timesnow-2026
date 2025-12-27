const crypto = require("node:crypto");
const config = require("../config/line.config");
const AppError = require("../utils/AppError");

const validateSignature = (body, signature) => {
  if (!config.channelSecret) {
    throw new AppError("LINE_CHANNEL_SECRET not configured", 500);
  }
  const hash = crypto
    .createHmac("sha256", config.channelSecret)
    .update(body)
    .digest("base64");
  if (process.env.NODE_ENV === "development") {
    console.log("Expected signature:", hash);
    console.log("Received signature:", signature);
  }
  return hash === signature;
};

const lineSignature = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log("Validating LINE signature for webhook");
    console.log("Method:", req.method);
    console.log("Headers:", req.headers);
  }
  // Skip signature validation for non-POST requests (for debugging)
  if (req.method !== "POST") {
    return next();
  }
  const signature = req.headers["x-line-signature"];
  if (!signature) {
    throw new AppError("Missing signature", 400);
  }

  const body = JSON.stringify(req.body);
  if (!validateSignature(body, signature)) {
    throw new AppError("Invalid signature", 400);
  }

  next();
};

module.exports = lineSignature;
