/**
 * src/modules/services/members.service.js
 *
 * บริการสำหรับจัดการข้อมูลสมาชิก
 */

// import models และอื่นๆ ที่จำเป็น
const { Attendance, Companies, Employee } = require("../models/liff.model");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

// ==============================================================
// ฟังก์ชันสำหรับดึงข้อมูลบริษัททั้งหมด
const companyService = () => {
  // ดึงข้อมูลบริษัททั้งหมดจากโมเดล
  return Companies.companyAll();
};

// ==============================================================
// ฟังก์ชันสำหรับสมัครสมาชิกใหม่
const registerService = catchAsync(async (userData) => {
  const existingMember = await Employee.findOne({
    where: { userId: userData.userId },
  });
  if (existingMember) {
    throw new AppError("สมาชิกนี้มีอยู่แล้วในระบบ", 400);
  }

  // สร้างสมาชิกใหม่
  const newMember = await Employee.create(userData);
  return newMember;
});

// ==============================================================
// ฟังก์ชันสำหรับแจ้งลืมลงเวลางาน
const forgetTimeService = catchAsync(async ({ userId, date, reason }) => {
  const member = await Employee.findOne({ where: { userId } });
  if (!member) {
    throw new AppError("ไม่พบสมาชิกในระบบ", 404);
  }

  return { message: "แจ้งลืมลงเวลางานสำเร็จ" };
});

// ส่งออกฟังก์ชันบริการ
module.exports = {
  registerService,
  forgetTimeService,
  companyService,
};
