const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const AppError = require("../../shared/utils/AppError");
const mailProvider = require("../../shared/providers/mail.provider");
const lineProvider = require("../../shared/providers/line.provider");
const {
  formatDateThai,
  normalizeTime,
  normalizeDate,
} = require("../../shared/utils/date");
const db = require("../../shared/config/db.config");

// Models
const { ForgetRequest } = require("../models/forgetRequest.model");
const { TimestampRecord } = require("../models/timestamp.model");
const { Employee, Companies } = require("../models/employee.model");

// Templates
const {
  forgetRequestEmail,
} = require("../../shared/templates/email/modules/forget-request.email");
const {
  forgetRequestPendingMessage,
  forgetRequestApprovedMessage,
  forgetRequestRejectedMessage,
} = require("../../shared/templates/flex/modules/forget-request.flex");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "30d"; // ลิงก์อนุมัติมีอายุ 30 วัน

// ==============================================================
//         ส่วนของ Utilities (Utilities)
// ==============================================================
// สำหรับแปลง type เป็นข้อความ
const mapTypeToText = (type) => {
  const map = {
    work_in: "เข้างาน",
    work_out: "ออกงาน",
    break_in: "พักเบรค",
    break_out: "กลับจากพัก",
    ot_in: "เข้า OT",
    ot_out: "ออก OT",
  };
  return map[type] || type;
};

// สำหรับแปลง type เป็น field name ในตาราง timestamp_records
const mapTypeToField = (type) => {
  const map = {
    work_in: "start_time",
    work_out: "end_time",
    break_in: "break_start_time",
    break_out: "break_end_time",
    ot_in: "ot_start_time",
    ot_out: "ot_end_time",
  };
  return map[type];
};

// ==============================================================
//        ส่วนของฟังก์ชันช่วยเหลือ (Helper Functions)
// ==============================================================
// Helper: อัปเดตเวลาจากคำขอลืมบันทึกเวลา
// Note: `employee` parameter was unused; function uses values from `request`.
const updateTimestampFromRequest = async (request, conn = null) => {
  const { employee_id, company_id, timestamp_type, forget_date, forget_time } =
    request;

  // Find existing record for this date
  // Note: forget_date is Date object or string 'YYYY-MM-DD'
  const dateStr =
    typeof forget_date === "string"
      ? forget_date
      : forget_date.toISOString().split("T")[0];

  let record = await TimestampRecord.findByEmployeeAndDate(
    employee_id,
    dateStr,
    conn
  );

  // ถ้ายังไม่มี Record ในวันนั้น -> ต้องสร้างใหม่ (พร้อม WorkingTime)
  if (record) {
    // มี Record แล้ว -> Update
    const fieldName = mapTypeToField(timestamp_type);
    if (fieldName) {
      await TimestampRecord.updateTimestamp(
        record.id,
        { [fieldName]: forget_time },
        conn
      );
    }
  } else {
    // ต้องสร้าง WorkingTime ก่อน
    // สมมติ month ดึงจาก date
    const month = new Date(dateStr).getMonth() + 1;

    const workingTimeId = await TimestampRecord.createWorkingTime(
      {
        companyId: company_id,
        employeeId: employee_id,
        date: dateStr,
        month,
      },
      conn
    );

    // สร้าง timestamp_records ว่างๆ ไว้ก่อน หรือใส่ค่าเลย
    const insertData = {
      employeeid: employee_id,
      workingTimeId,
      companyId: company_id,
    };

    // Map field ตาม type
    const fieldName = mapTypeToField(timestamp_type);
    if (fieldName) {
      insertData[fieldName] = forget_time;
    }

    await TimestampRecord.createTimestamp(insertData, conn);
  }
};

// Helper: สร้างรหัสคำขอลืมบันทึกเวลาแบบไม่ซ้ำกัน
const generateUniqueRequestId = async (datePart) => {
  const generateSuffix = () =>
    crypto
      .randomBytes(3)
      .toString("base64")
      .replaceAll(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 4);

  let requestId;
  for (let i = 0; i < 5; i++) {
    const suffix = generateSuffix();
    requestId = `REQ-${datePart}-${suffix}`;
    const existing = await ForgetRequest.findByRequestId(requestId);
    if (!existing) break;
    requestId = null;
  }
  if (!requestId) {
    requestId = `REQ-${datePart}-${crypto
      .randomBytes(4)
      .toString("hex")
      .slice(0, 4)
      .toUpperCase()}`;
  }
  return requestId;
};

// Helper: ส่งอีเมลคำขอลืมบันทึกเวลาไปยัง HR
const sendForgetRequestEmail = async (
  company,
  employee,
  {
    normalizedDate,
    normalizedTime,
    type,
    reason,
    requestId,
    originalTime,
    evidence,
  }
) => {
  if (!company) {
    console.warn(`Company not found when sending forget-request email.`);
    return;
  }
  if (!company.hr_email) {
    console.warn(`Company ${company.id} does not have HR email.`);
    return;
  }

  // สร้าง Token พร้อมฝังข้อมูลสำหรับแสดงผลหน้าเว็บ (Snapshot Data)
  const tokenPayload = {
    requestId,
    action: "approve",
    employeeName: employee.name,
    date: formatDateThai(normalizedDate),
    currentTime: originalTime,
    time: normalizedTime.substring(0, 5),
    type: mapTypeToText(type),
    reason: reason || "-",
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  const approveLink = `https://liff-timesnow-2024.web.app/approve-forget?token=${token}`;

  const emailHtml = forgetRequestEmail({
    name: employee.name,
    department: employee.departmentId ? employee.departmentId : "-",
    date: tokenPayload.date,
    time: tokenPayload.time,
    type: tokenPayload.type,
    reason: tokenPayload.reason,
    evidence, // ส่งหลักฐานไปที่อีเมล
    approveLink,
    originalTime,
  });

  try {
    const mailOptions = {
      to: company.hr_email,
      subject: `[Time Now] คำขอลืมบันทึกเวลา - ${employee.name}`,
      html: emailHtml,
    };

    if (evidence) {
      mailOptions.attachments = [
        {
          path: evidence, // Nodemailer รองรับ URL หรือ File Path
        },
      ];
    }

    await mailProvider.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send forget-request email:", err);
  }
};

// Helper: ส่งข้อความ LINE แจ้งเตือนคำขอลืมบันทึกเวลารอการอนุมัติ
const sendPendingLineMessage = async (
  lineUserId,
  normalizedDate,
  normalizedTime,
  type
) => {
  const flexMessage = forgetRequestPendingMessage({
    date: formatDateThai(normalizedDate),
    time: normalizedTime.substring(0, 5),
    type,
  });

  try {
    await lineProvider.push(lineUserId, flexMessage);
  } catch (err) {
    console.error("Failed to send LINE pending message:", err);
  }
};

// Helper: ดึงข้อมูลคำขอและพนักงานจาก Token
const getRequestFromToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error(err);
    throw new AppError("Token ไม่ถูกต้องหรือหมดอายุ", 400);
  }

  const { requestId } = decoded;
  const request = await ForgetRequest.findByRequestId(requestId);

  if (!request) {
    throw new AppError("ไม่พบข้อมูลคำขอ", 404);
  }

  if (request.status !== "pending") {
    throw new AppError("คำขอนี้ถูกดำเนินการไปแล้ว", 400);
  }

  const employee = await Employee.findById(request.employee_id);
  if (!employee) throw new AppError("ไม่พบข้อมูลพนักงาน", 404);

  return { request, employee };
};

// Helper: จัดการการอนุมัติคำขอ
const handleApproval = async (request, employee) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await updateTimestampFromRequest(request, conn);

    await ForgetRequest.updateStatus(request.id, "approved", conn);

    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch (err) {
      console.error("Rollback failed:", err);
    }
    conn.release();
    throw err;
  }
  conn.release();

  const flex = forgetRequestApprovedMessage({
    date: formatDateThai(request.forget_date),
    time: request.forget_time.substring(0, 5),
    type: request.timestamp_type,
  });
  try {
    await lineProvider.push(employee.lineUserId, flex);
  } catch (err) {
    console.error("Failed to send LINE approved message:", err);
  }
};

// Helper: จัดการการปฏิเสธคำขอ
const handleRejection = async (request, employee, reason) => {
  await ForgetRequest.updateStatus(request.id, "rejected");

  const flex = forgetRequestRejectedMessage({
    date: formatDateThai(request.forget_date),
    type: request.timestamp_type,
    reason,
  });
  try {
    await lineProvider.push(employee.lineUserId, flex);
  } catch (err) {
    console.error("Failed to send LINE rejected message:", err);
  }
};

// ==============================================================
//          ส่วนของฟังก์ชันบริการ (Service Functions)
// ==============================================================
// ฟังก์ชันสำหรับสร้างคำขอลืมลงเวลา
const createRequest = async ({
  lineUserId,
  companyId,
  date,
  time,
  type,
  reason,
  evidence,
}) => {
  // 1. ตรวจสอบพนักงาน
  const employee = await Employee.findByLineUserId(lineUserId);
  if (!employee) {
    throw new AppError("ไม่พบข้อมูลพนักงาน", 404);
  }

  // ตรวจสอบ companyId
  if (!companyId) {
    companyId = employee.companyId;
  } else if (companyId != employee.companyId) {
    throw new AppError("ข้อมูลบริษัทไม่ถูกต้อง", 400);
  }

  // 2. ตรวจสอบและ normalize วันที่/เวลา
  const normalizedDate = normalizeDate(date); // YYYY-MM-DD
  if (!normalizedDate) throw new AppError("วันที่ไม่ถูกต้อง", 400);

  const normalizedTime = normalizeTime(time); // HH:mm:ss
  const existingRequest = await ForgetRequest.findPendingDuplicate(
    employee.id,
    normalizedDate,
    type
  );
  if (existingRequest) {
    throw new AppError(
      "คุณมีคำขอที่รอการอนุมัติสำหรับรายการนี้แล้ว กรุณารอผลการอนุมัติ",
      400
    );
  }

  // 3. สร้าง requestId ในรูปแบบ REQ-YYYYMMDD-XXXX (4 chars alphanumeric uppercase)
  const datePart = normalizedDate.replaceAll("-", "");
  const requestId = await generateUniqueRequestId(datePart);

  // 4. บันทึกคำขอ
  await ForgetRequest.create({
    request_id: requestId,
    employee_id: employee.id,
    company_id: companyId,
    timestamp_type: type,
    forget_date: normalizedDate,
    forget_time: normalizedTime,
    reason,
    evidence, // Base64 or URL
    status: "pending",
  });

  // 5. หาเวลาเดิม (Snapshot Original Time) เพื่อแนบไปกับ Token และ Email
  let originalTime = "-";
  try {
    const existingRecord = await TimestampRecord.findByEmployeeAndDate(
      employee.id,
      normalizedDate
    );
    if (existingRecord) {
      // 1. ลองดึงตามประเภทก่อน (เช่น ขอแก้เวลาออก ก็ควรโชว์เวลาออกเดิม ถ้ามี)
      const fieldName = mapTypeToField(type);
      if (fieldName && existingRecord[fieldName]) {
        originalTime = normalizeTime(existingRecord[fieldName]).substring(0, 5);
      }
      // ถ้าไม่มีค่าตามประเภท ก็ให้แสดงค่าว่าง
    }
  } catch (err) {
    console.warn("Failed to fetch original time for snapshot:", err);
  }

  // 6. ส่งอีเมลหา HR
  const company = await Companies.findById(companyId);
  await sendForgetRequestEmail(company, employee, {
    normalizedDate,
    normalizedTime,
    type,
    reason,
    requestId,
    originalTime,
    evidence,
  });

  // 7. ส่งแจ้งเตือน LINE ให้พนักงาน (Pending)
  await sendPendingLineMessage(
    lineUserId,
    normalizedDate,
    normalizedTime,
    type
  );

  return { requestId };
};

// Helper: ดึงและตรวจสอบ Token รวมถึงจัดการกรณีหมดอายุ
const getDecodedToken = async (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const unsafeDecoded = jwt.decode(token);
      if (unsafeDecoded?.requestId) {
        const req = await ForgetRequest.findByRequestId(
          unsafeDecoded.requestId
        );
        if (req && req.status !== "pending") {
          return unsafeDecoded;
        }
      }
      throw new AppError("ลิงก์อนุมัตินี้หมดอายุแล้ว", 400);
    } else {
      throw new AppError("Token ไม่ถูกต้อง", 400);
    }
  }
};

// Helper: ดึงข้อมูลเวลาเดิม
const getCurrentTime = async (employeeId, dateStr, timestampType) => {
  const existingRecord = await TimestampRecord.findByEmployeeAndDate(
    employeeId,
    dateStr
  );
  if (existingRecord) {
    const fieldName = mapTypeToField(timestampType);
    if (fieldName && existingRecord[fieldName]) {
      return normalizeTime(existingRecord[fieldName]).substring(0, 5);
    }
    // Fallback to start_time if specific field is empty
    if (existingRecord.start_time) {
      return normalizeTime(existingRecord.start_time).substring(0, 5);
    }
  }
  return "-";
};

// ============================================================
// ฟังก์ชันสำหรับดึงข้อมูลคำขอจาก Token (สำหรับหน้าอนุมัติ)
const getRequestInfo = async (token) => {
  const decoded = await getDecodedToken(token);
  const { requestId } = decoded;
  const request = await ForgetRequest.findByRequestId(requestId);

  if (!request) {
    throw new AppError("ไม่พบข้อมูลคำขอ", 404);
  }

  const isExpired = Date.now() >= decoded.exp * 1000;
  if (request.status === "pending" && isExpired) {
    throw new AppError("ลิงก์อนุมัตินี้หมดอายุแล้ว", 400);
  }

  const employee = await Employee.findById(request.employee_id);
  const dateStr =
    typeof request.forget_date === "string"
      ? request.forget_date
      : request.forget_date.toISOString().split("T")[0];

  const currentTime = await getCurrentTime(
    request.employee_id,
    dateStr,
    request.timestamp_type
  );

  return {
    id: request.id,
    requestId: request.request_id,
    employeeName: employee ? employee.name : "Unknown",
    date: formatDateThai(request.forget_date),
    time: request.forget_time ? request.forget_time.substring(0, 5) : "-",
    type: mapTypeToText(request.timestamp_type),
    reason: request.reason || "-",
    status: request.status,
    approved_at: request.approved_at || null,
    currentTime,
  };
};

// ============================================================
// ฟังก์ชันสำหรับอนุมัติ/ปฏิเสธ คำขอ
const processApproval = async ({ token, action, reason }) => {
  const { request, employee } = await getRequestFromToken(token);

  if (action === "approve") {
    await handleApproval(request, employee);
  } else if (action === "reject") {
    await handleRejection(request, employee, reason);
  } else {
    throw new AppError("Invalid Action", 400);
  }

  return { status: "success", action };
};

module.exports = {
  createRequest,
  getRequestInfo,
  processApproval,
};
