/**
 * src/modules/liff/liff.controller.js
 *
 * ควบคุมการทำงานของ LIFF (LINE Front-end Framework)
 */

// import services และอื่นๆ ที่จำเป็น
const {
  companyService,
  registerService,
  approveService,
  checkRegistrationStatusService,
} = require("../services/register.service");
const {
  createRequest,
  getRequestInfo,
  processApproval: processApprovalRequest,
  scanMissingTimestamps,
} = require("../services/forgetRequest.service");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

class LiffController {
  // ====================================================================
  // ฟังก์ชันสำหรับดึงข้อมูลบริษัททั้งหมด
  getCompanies = catchAsync(async (_req, res, _next) => {
    const companies = await companyService();
    res.status(200).json({
      status: "success",
      data: companies,
    });
  });

  // ====================================================================
  // ฟังก์ชันสำหรับลงทะเบียนสมาชิกผ่าน LIFF
  register = catchAsync(async (req, res, _next) => {
    const { name, IDCard, companyId, lineUserId, start_date } = req.body;
    if (!name || !IDCard || !companyId || !lineUserId || !start_date) {
      throw new AppError("ข้อมูลไม่ครบถ้วนสำหรับการลงทะเบียน", 400);
    }
    const result = await registerService({
      name,
      IDCard,
      companyId,
      lineUserId,
      start_date,
    });
    res.status(201).json({
      status: "success",
      data: result,
    });
  });

  // ====================================================================
  // ฟังก์ชันสำหรับอนุมัติ/ปฏิเสธ การลงทะเบียนสมาชิก
  approveRegistration = catchAsync(async (req, res, _next) => {
    const { token, action, reason } = req.body;
    if (!token) {
      throw new AppError("ไม่พบ Token การยืนยันตัวตน", 400);
    }
    if (!action || !["approve", "reject"].includes(action)) {
      throw new AppError(
        "การดำเนินการไม่ถูกต้อง (ต้องเป็น approve หรือ reject)",
        400
      );
    }
    const result = await approveService({ token, action, reason });
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  // ====================================================================
  // ฟังก์ชันสำหรับตรวจสอบสถานะการลงทะเบียน
  checkRegistrationStatus = catchAsync(async (req, res, _next) => {
    const { token } = req.body;
    if (!token) {
      throw new AppError("ไม่พบ Token การยืนยันตัวตน", 400);
    }
    const result = await checkRegistrationStatusService(token);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  // ====================================================================
  // ฟังก์ชันสำหรับแจ้งลืมลงเวลางานผ่าน LIFF
  createForgetRequest = catchAsync(async (req, res, _next) => {
    const { lineUserId, companyId, date, time, type, reason, evidence } =
      req.body;

    const result = await createRequest({
      lineUserId,
      companyId,
      date,
      time,
      type,
      reason,
      evidence,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  });

  // ====================================================================
  // ฟังก์ชันสแกนหาการลืมบันทึกเวลา
  getMissingTimestamps = catchAsync(async (req, res, _next) => {
    const { lineUserId } = req.body;
    if (!lineUserId) {
      throw new AppError("Line User ID is required", 400);
    }
    const result = await scanMissingTimestamps(lineUserId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  // ====================================================================
  // ฟังก์ชันสำหรับดึงข้อมูลคำขอ (สำหรับหน้าอนุมัติ)
  getForgetRequestInfo = catchAsync(async (req, res, _next) => {
    const { token } = req.body;
    if (!token) throw new AppError("Token is required", 400);

    const result = await getRequestInfo(token);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  // ====================================================================
  // ฟังก์ชันสำหรับอนุมัติ/ปฏิเสธ คำขอ (สำหรับหน้าอนุมัติ)
  approveForgetRequest = catchAsync(async (req, res, _next) => {
    const { token, action, reason } = req.body;
    if (!token) throw new AppError("Token is required", 400);

    const result = await processApprovalRequest({ token, action, reason });
    res.status(200).json({
      status: "success",
      data: result,
    });
  });
}

module.exports = new LiffController();
