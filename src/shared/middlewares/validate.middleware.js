/**
 * src/shared/middlewares/validate.middleware.js
 *
 * Middleware สำหรับการตรวจสอบความถูกต้องของข้อมูล (Validation Middleware)
 * ใช้ร่วมกับไลบรารี Joi เพื่อทำการตรวจสอบข้อมูลที่เข้ามาในคำขอ (request)
 */

const Joi = require("joi");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// ฟังก์ชันสำหรับสร้าง middleware การตรวจสอบข้อมูล
const validate = (schema, property = "body") => {
  return catchAsync(async (req, res, next) => {
    const dataToValidate = req[property];
    const { error } = schema.validate(dataToValidate, {
      abortEarly: false, // ตรวจสอบข้อผิดพลาดทั้งหมด
      allowUnknown: true, // อนุญาตให้มีฟิลด์ที่ไม่อยู่ในสคีมา
      stripUnknown: true, // ลบฟิลด์ที่ไม่อยู่ในสคีมาออก
    });

    if (error) {
      const errorMessages = error.details
        .map((detail) => detail.message)
        .join(". ");
      return next(new AppError(`ข้อมูลไม่ถูกต้อง: ${errorMessages}`, 400));
    }

    next();
  });
};

// ========================================
// Auth Validation Schemas
// ========================================
const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(30).required(),
    IDCard: Joi.string().length(13).required(),
    companyId: Joi.number().integer().positive().required(),
    lineUserId: Joi.string().max(100).required(),
    start_date: Joi.date().iso().required(),
  }),
  approve: Joi.object({
    token: Joi.string().required(),
    action: Joi.string().valid("approve", "reject").required(),
    reason: Joi.string().max(500).allow("", null),
  }),
  checkStatus: Joi.object({
    token: Joi.string().required(),
  }),
};

// ========================================
// Attendance Validation Schemas
// ========================================
const attendanceSchemas = {
  forgetTime: Joi.object({
    timestamp_type: Joi.string()
      .valid("work_in", "break_in", "ot_in", "work_out", "break_out", "ot_out")
      .required(),
    date: Joi.date().iso().required(),
    time: Joi.string()
      .pattern(/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
      .required(),
    reason: Joi.string().max(500).required(),
    evidence: Joi.string().max(65535).allow("", null),
  }),
};

// ======================================================================
module.exports = { validate, authSchemas, attendanceSchemas };
