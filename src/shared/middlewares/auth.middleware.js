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
  try {
    const params = new URLSearchParams();
    params.append("id_token", token);
    params.append("client_id", config.channelId);

    const response = await axios.post(
      "https://api.line.me/oauth2/v2.1/verify",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // หากตรวจสอบสำเร็จ ให้แนบข้อมูลผู้ใช้ไปกับ req
    req.user = response.data;
    return next();
  } catch (err) {
    // ให้ข้อผิดพลาดชัดเจนขึ้นเมื่อ LINE บอกว่า parameter หายหรือ token ไม่ถูกต้อง
    const message =
      err?.response?.data?.error_description || err?.message || "Invalid token";
    throw new AppError(message, 401);
  }
});

module.exports = auth;
