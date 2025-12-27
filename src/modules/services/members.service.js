/**
 * src/modules/services/members.service.js
 *
 * บริการสำหรับจัดการข้อมูลสมาชิก
 */

// import models และอื่นๆ ที่จำเป็น
const Member = require("../../modules/models/members.model");
const catchAsync = require("../../shared/utils/catchAsync");
const AppError = require("../../shared/utils/AppError");

// ฟังก์ชันสำหรับสมัครสมาชิกใหม่
const registerMember = catchAsync(async (memberData) => {
  const existingMember = await Member.findOne({
    where: { userId: memberData.userId },
  });
  if (existingMember) {
    throw new AppError("สมาชิกนี้มีอยู่แล้วในระบบ", 400);
  }

  const newMember = await Member.create(memberData);
  return newMember;
});

// ฟังก์ชันสำหรับแจ้งลืมลงเวลางาน
const forgetTime = catchAsync(async ({ userId, date, reason }) => {
  const member = await Member.findOne({ where: { userId } });
  if (!member) {
    throw new AppError("ไม่พบสมาชิกในระบบ", 404);
  }

  return { message: "แจ้งลืมลงเวลางานสำเร็จ" };
});

// ส่งออกฟังก์ชันบริการ
module.exports = {
  registerMember,
  forgetTime,
};
