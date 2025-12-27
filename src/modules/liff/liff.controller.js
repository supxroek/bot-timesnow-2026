/**
 * src/modules/liff/liff.controller.js
 *
 * ควบคุมการทำงานของ LIFF (LINE Front-end Framework)
 */

// import services และอื่นๆ ที่จำเป็น
const { registerMember, forgetTime } = require("../services/members.service");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

class LiffController {
  // ฟังก์ชันสำหรับลงทะเบียนสมาชิกผ่าน LIFF
  register = catchAsync(async (req, res, next) => {
    const { userId, name, email } = req.body;
    if (!userId || !name || !email) {
      throw new AppError("ข้อมูลไม่ครบถ้วนสำหรับการลงทะเบียน", 400);
    }
    const result = registerMember({ userId, name, email });
    res.status(201).json({
      status: "success",
      data: result,
    });
  });

  // ฟังก์ชันสำหรับแจ้งลืมลงเวลางานผ่าน LIFF
  forgetTime = catchAsync(async (req, res, next) => {
    const { userId, date, reason } = req.body;
    if (!userId || !date || !reason) {
      throw new AppError("ข้อมูลไม่ครบถ้วนสำหรับการแจ้งลืมลงเวลางาน", 400);
    }
    const result = forgetTime({ userId, date, reason });
    res.status(200).json({
      status: "success",
      data: result,
    });
  });
}

module.exports = new LiffController();
