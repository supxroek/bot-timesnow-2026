/**
 * src/modules/services/members.service.js
 *
 * บริการสำหรับจัดการข้อมูลสมาชิก
 */

// import models และอื่นๆ ที่จำเป็น
const { Attendance, Companies, Employee } = require("../models/liff.model");
const AppError = require("../../shared/utils/AppError");
const lineProvider = require("../../shared/providers/line.provider");

// รหัส Rich Menu สำหรับสมาชิก
const MEMBER_RICH_MENU_ID = "richmenu-30b97e17ac5d13d9cbe70bd9a0a04722";

// ==============================================================
// ฟังก์ชันสำหรับดึงข้อมูลบริษัททั้งหมด
const companyService = async () => {
  // ดึงข้อมูลบริษัททั้งหมดจากโมเดล
  return Companies.companyAll();
};

// ==============================================================
// ฟังก์ชันสำหรับสมัครสมาชิกใหม่
const registerService = async (userData) => {
  // ตรวจสอบว่ามีสมาชิกที่ยังใช้งานอยู่หรือไม่ (ยังไม่ลาออก)
  const existingMember = await Employee.findActiveByLineUserId({
    where: { userId: userData.lineUserId },
  });
  if (existingMember) {
    throw new AppError("สมาชิกนี้มีอยู่แล้วในระบบ", 400);
  }

  // สร้างสมาชิกใหม่
  const newMember = await Employee.create(userData);

  // Link Rich Menu สำหรับสมาชิก
  try {
    await lineProvider.linkRichMenu(userData.lineUserId, MEMBER_RICH_MENU_ID);
    console.log(
      `เชื่อมต่อ Rich Menu ${MEMBER_RICH_MENU_ID} กับผู้ใช้ ${userData.lineUserId} เรียบร้อยแล้ว`
    );
  } catch (error) {
    console.error(
      `ไม่สามารถเชื่อมต่อ Rich Menu กับผู้ใช้ ${userData.lineUserId} ได้:`,
      error
    );
    // ไม่ throw error เพื่อให้การลงทะเบียนยังคงสำเร็จแม้จะเปลี่ยนเมนูไม่ได้
  }

  return newMember;
};

// ==============================================================
// ฟังก์ชันสำหรับแจ้งลืมลงเวลางาน
const forgetTimeService = async ({ userId, date, reason }) => {
  // ตรวจสอบว่าสมาชิกยังใช้งานอยู่หรือไม่
  const member = await Employee.findActiveByLineUserId({ where: { userId } });
  if (!member) {
    throw new AppError("ไม่พบสมาชิกในระบบ หรือสมาชิกได้ลาออกไปแล้ว", 404);
  }

  return { message: "แจ้งลืมลงเวลางานสำเร็จ" };
};

// ส่งออกฟังก์ชันบริการ
module.exports = {
  registerService,
  forgetTimeService,
  companyService,
};
