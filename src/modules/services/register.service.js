/**
 * src/modules/services/register.service.js
 *
 * บริการสำหรับการลงทะเบียนสมาชิกใหม่
 */

// import โมเดลที่จำเป็นและไลบรารีอื่นๆ
const { Companies } = require("../models/employee.model");
const { Employee } = require("../models/employee.model");
const AppError = require("../../shared/utils/AppError");
const lineProvider = require("../../shared/providers/line.provider");
const mailProvider = require("../../shared/providers/mail.provider");
const jwt = require("jsonwebtoken");
const {
  registerRequestEmail,
} = require("../../shared/templates/email/modules/register-request.email");
const {
  registerPendingMessage,
  registerApprovedMessage,
  registerRejectedMessage,
} = require("../../shared/templates/flex/modules/register.flex");

// รหัส Rich Menu สำหรับสมาชิก
const MEMBER_RICH_MENU_ID = "richmenu-30b97e17ac5d13d9cbe70bd9a0a04722";

// JWT Secret และ Token Expiry
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "30m"; // 30 นาที

// ==============================================================
//        ส่วนของฟังก์ชันช่วยเหลือ (Helper Functions)
// ==============================================================
// Helper: ถอดรหัส JWT Token สำหรับการอนุมัติ
const decodeApprovalToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(
        "ลิงก์อนุมัตินี้หมดอายุแล้ว กรุณาให้ผู้ใช้ทำการสมัครใหม่",
        400
      );
    }
    throw new AppError("Token ไม่ถูกต้อง", 400);
  }
};

// Helper: ตรวจสอบข้อมูลก่อนอนุมัติ
const validateApprovalData = async (decoded) => {
  const { companyId, lineUserId, IDCard } = decoded;

  // ตรวจสอบข้อมูลบริษัท
  const company = await Companies.findById(companyId);
  if (!company) {
    throw new AppError("ไม่พบข้อมูลบริษัท", 404);
  }

  // ตรวจสอบว่ามีข้อมูลพนักงานอยู่หรือไม่ (รวมทั้งที่ลาออกแล้ว)
  const existingEmployee = await Employee.findResignedEmployee(
    lineUserId,
    IDCard,
    companyId
  );

  // ถ้าพนักงานยังทำงานอยู่ (resign_date = null หรือยังไม่ถึง) => ไม่อนุญาตให้อนุมัติซ้ำ
  if (
    existingEmployee &&
    (!existingEmployee.resign_date ||
      new Date(existingEmployee.resign_date) > new Date())
  ) {
    throw new AppError(
      "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว",
      400
    );
  }

  // ตรวจสอบขีดจำกัดสมาชิก
  if (company.employeeLimit) {
    const currentCount = await Employee.countByCompanyId(companyId);
    if (currentCount >= company.employeeLimit) {
      throw new AppError("บริษัทนี้มีจำนวนสมาชิกครบตามจำนวนที่กำหนดแล้ว", 400);
    }
  }

  return { company, existingEmployee };
};

// Helper: ดำเนินการอนุมัติ - บันทึกข้อมูลลง DB
const processApproval = async (decoded, existingEmployee) => {
  const { name, IDCard, companyId, lineUserId, start_date } = decoded;

  try {
    // ถ้าพนักงานเคยลาออกแล้ว => อัพเดทข้อมูลและ reset resign_date = null
    if (
      existingEmployee?.resign_date &&
      new Date(existingEmployee.resign_date) <= new Date()
    ) {
      await Employee.reactivateEmployee(existingEmployee.id, {
        name,
        IDCard,
        lineUserId,
        start_date,
      });
    } else {
      // ถ้าไม่เคยมีข้อมูล => สร้างใหม่
      await Employee.create({
        name,
        IDCard,
        companyId,
        lineUserId,
        start_date,
      });
    }
  } catch (error) {
    // จัดการ Duplicate Entry Error
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
      throw new AppError(
        "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว ไม่สามารถอนุมัติซ้ำได้",
        400
      );
    }
    // Error อื่นๆ ให้ throw ต่อ
    throw error;
  }

  // Link Rich Menu
  await linkRichMenuSafe(lineUserId);

  // แจ้งเตือนผู้ใช้ผ่าน LINE
  await sendLineNotificationSafe(
    lineUserId,
    registerApprovedMessage({ name, IDCard, start_date })
  );

  return {
    message: "อนุมัติคำขอลงทะเบียนสำเร็จ",
    action: "approved",
    userData: { name, IDCard, companyId, lineUserId, start_date },
  };
};

// Helper: ดำเนินการปฏิเสธ - แจ้งผู้ใช้เท่านั้น (ไม่บันทึก DB)
const processRejection = async (decoded, reason) => {
  const { name, IDCard, companyId, lineUserId, start_date } = decoded;

  // แจ้งเตือนผู้ใช้ผ่าน LINE เท่านั้น
  await sendLineNotificationSafe(
    lineUserId,
    registerRejectedMessage({ name, IDCard, start_date, reason })
  );

  return {
    message: "ปฏิเสธคำขอลงทะเบียนเรียบร้อย",
    action: "rejected",
    userData: { name, IDCard, companyId, lineUserId, start_date },
  };
};

// Helper: Link Rich Menu อย่างปลอดภัย
const linkRichMenuSafe = async (lineUserId) => {
  try {
    await lineProvider.linkRichMenu(lineUserId, MEMBER_RICH_MENU_ID);
  } catch (err) {
    console.error("Failed to link rich menu:", err);
  }
};

// Helper: ส่ง LINE Notification อย่างปลอดภัย
const sendLineNotificationSafe = async (lineUserId, message) => {
  try {
    await lineProvider.push(lineUserId, message);
  } catch (error_) {
    console.error("Failed to send LINE notification:", error_);
  }
};

// ==============================================================
//          ส่วนของฟังก์ชันบริการ (Service Functions)
// ==============================================================
// ฟังก์ชันสำหรับดึงข้อมูลบริษัททั้งหมด
const companyService = async () => {
  // ดึงข้อมูลบริษัททั้งหมดจากโมเดล
  return Companies.companyAll();
};

// ==============================================================
// ฟังก์ชันสำหรับสมัครสมาชิกใหม่ (ส่งคำขอรอการอนุมัติ - ยังไม่บันทึกลง DB)
const registerService = async (userData) => {
  const { name, IDCard, companyId, lineUserId, start_date } = userData;

  // 1. ตรวจสอบข้อมูลบริษัท
  const company = await Companies.findById(companyId);
  if (!company) {
    throw new AppError("ไม่พบข้อมูลบริษัท", 404);
  }

  // 2. ตรวจสอบขีดจำกัดสมาชิก (ถ้ามี)
  if (company.employeeLimit) {
    const currentCount = await Employee.countByCompanyId(companyId);
    if (currentCount >= company.employeeLimit) {
      throw new AppError("บริษัทนี้มีจำนวนสมาชิกครบตามจำนวนที่กำหนดแล้ว", 400);
    }
  }

  // 3. ตรวจสอบว่า lineUserId หรือ IDCard นี้เคยลงทะเบียนไว้หรือไม่ (รวมทั้งที่ลาออกแล้ว)
  const existingEmployee = await Employee.findResignedEmployee(
    lineUserId,
    IDCard,
    companyId
  );

  // ถ้าพบข้อมูล แต่พนักงานยังทำงานอยู่ (resign_date = null หรือยังไม่ถึง) => ไม่อนุญาตให้สมัครใหม่
  if (
    existingEmployee &&
    (!existingEmployee.resign_date ||
      new Date(existingEmployee.resign_date) > new Date())
  ) {
    throw new AppError("คุณเป็นสมาชิกของบริษัทนี้อยู่แล้ว", 400);
  }

  // ถ้าพบข้อมูล และพนักงานลาออกไปแล้ว => อนุญาตให้สมัครใหม่ได้ (จะอัพเดทข้อมูลในขั้นตอนอนุมัติ)
  // ไม่ต้อง throw error

  // 5. สร้าง Token สำหรับการอนุมัติ (เก็บข้อมูลไว้ใน token)
  const token = jwt.sign(
    { name, IDCard, companyId, lineUserId, start_date },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  // 6. แจ้งเตือนคำขอลงทะเบียนผ่านอีเมล (HR, Admin) - ส่งลิงก์เดียว
  if (company.hr_email) {
    const approveLink = `https://liff-timesnow-2024.web.app/approve-register?token=${token}`;

    try {
      await mailProvider.sendMail({
        to: company.hr_email,
        subject: `คำขอลงทะเบียนพนักงานใหม่: ${name}`,
        html: registerRequestEmail({ name, IDCard, start_date, approveLink }),
      });
    } catch (error_) {
      console.error("Failed to send email:", error_);
    }
  }

  // 7. แจ้งเตือนผลการลงทะเบียน (รอการอนุมัติ) ผ่าน LINE
  await sendLineNotificationSafe(
    lineUserId,
    registerPendingMessage({ name, IDCard, start_date })
  );

  return {
    message: "คำขอลงทะเบียนของคุณถูกส่งไปยังผู้ดูแลระบบแล้ว กรุณารอการอนุมัติ",
    ...userData,
  };
};

// ==============================================================
// ฟังก์ชันสำหรับตรวจสอบสถานะการลงทะเบียน
const checkRegistrationStatusService = async (token) => {
  // 1. ถอดรหัส token
  const decoded = decodeApprovalToken(token);
  const { name, IDCard, companyId, lineUserId, start_date } = decoded;

  // 2. ตรวจสอบข้อมูลบริษัท
  const company = await Companies.findById(companyId);
  if (!company) {
    throw new AppError("ไม่พบข้อมูลบริษัท", 404);
  }

  // 3. ตรวจสอบว่าได้ลงทะเบียนไปแล้วหรือไม่
  const registeredEmployee = await Employee.checkRegistrationStatus(
    lineUserId,
    IDCard,
    companyId
  );

  if (registeredEmployee) {
    return {
      isRegistered: true,
      message: "ผู้ใช้นี้ได้รับการอนุมัติและลงทะเบียนเรียบร้อยแล้ว",
      userData: {
        name: registeredEmployee.name,
        IDCard: registeredEmployee.ID_or_Passport_Number,
        lineUserId: registeredEmployee.lineUserId,
        start_date: registeredEmployee.start_date,
        registered_at: registeredEmployee.created_at,
      },
    };
  }

  return {
    isRegistered: false,
    message: "คำขอลงทะเบียนยังไม่ได้รับการอนุมัติ",
    userData: { name, IDCard, companyId, lineUserId, start_date },
  };
};

// ==============================================================
// ฟังก์ชันสำหรับอนุมัติ/ปฏิเสธ การลงทะเบียน
const approveService = async ({ token, action, reason }) => {
  // 1. ถอดรหัส token
  const decoded = decodeApprovalToken(token);

  // 2. ดำเนินการตาม action
  if (action === "approve") {
    // ตรวจสอบข้อมูลก่อนอนุมัติ
    const { existingEmployee } = await validateApprovalData(decoded);
    return processApproval(decoded, existingEmployee);
  }

  if (action === "reject") {
    // ปฏิเสธ - แค่แจ้งผู้ใช้ ไม่ต้องตรวจสอบ
    return processRejection(decoded, reason);
  }

  throw new AppError("การดำเนินการไม่ถูกต้อง", 400);
};

// ส่งออกฟังก์ชันบริการ
module.exports = {
  companyService,
  registerService,
  checkRegistrationStatusService,
  approveService,
};
