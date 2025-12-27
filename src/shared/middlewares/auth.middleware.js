const axios = require("axios");
const config = require("../config/line.config");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const auth = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("ไม่พบ Authorization header หรือรูปแบบไม่ถูกต้อง", 401);
  }

  const token = authHeader.substring(7);

  // ตรวจสอบโทเค็นกับ LINE OAuth2 API
  const response = await axios.post("https://api.line.me/oauth2/v2.1/verify", {
    id_token: token,
    client_id: config.channelId,
  });

  // หากตรวจสอบสำเร็จ ให้แนบข้อมูลผู้ใช้ไปกับ req
  req.user = response.data;
  next();
});

module.exports = auth;
