/**
 * src/modules/liff/liff.controller.js
 *
 * ควบคุมการทำงานของ LIFF (LINE Front-end Framework)
 */

// import services และอื่นๆ ที่จำเป็น
const {
  registerService,
  forgetTimeService,
  companyService,
} = require("../services/liff.service");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

class LiffController {
  // ฟังก์ชันสำหรับดึงข้อมูลบริษัททั้งหมด
  getCompanies = catchAsync(async (_req, res, _next) => {
    const companies = await companyService();
    res.status(200).json({
      status: "success",
      data: companies,
    });
  });

  // ฟังก์ชันสำหรับลงทะเบียนสมาชิกผ่าน LIFF
  register = catchAsync(async (req, res, _next) => {
    const { name, id_card, companyId, lineUserId, start_date } = req.body;
    if (!name || !id_card || !companyId || !lineUserId || !start_date) {
      throw new AppError("ข้อมูลไม่ครบถ้วนสำหรับการลงทะเบียน", 400);
    }
    const result = await registerService({
      name,
      id_card,
      companyId,
      lineUserId,
      start_date,
    });
    res.status(201).json({
      status: "success",
      data: result,
    });
  });

  // ฟังก์ชันสำหรับแจ้งลืมลงเวลางานผ่าน LIFF
  forgetTime = catchAsync(async (req, res, _next) => {
    const { userId, date, reason } = req.body;
    if (!userId || !date || !reason) {
      throw new AppError("ข้อมูลไม่ครบถ้วนสำหรับการแจ้งลืมลงเวลางาน", 400);
    }
    const result = await forgetTimeService({ userId, date, reason });
    res.status(200).json({
      status: "success",
      data: result,
    });
  });
}

module.exports = new LiffController();
