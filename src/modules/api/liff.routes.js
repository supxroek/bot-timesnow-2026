// src/modules/liff/liff.routes.js

const express = require("express");
const router = express.Router();

// import middlewares validation and controller
const auth = require("../../shared/middlewares/auth.middleware");
const {
  validate,
  authSchemas,
  attendanceSchemas,
} = require("../../shared/middlewares/validate.middleware");
const liffController = require("./liff.controller");

// LIFF routes
router
  // endpoint to register - สำหรับลงทะเบียนสมาชิก
  .post(
    "/register",
    auth,
    validate(authSchemas.register),
    liffController.register
  )

  // endpoint to approve registration - สำหรับอนุมัติ/ปฏิเสธ การลงทะเบียน (ไม่ต้อง auth เพราะใช้ token)
  .post(
    "/register/approve",
    validate(authSchemas.approve),
    liffController.approveRegistration
  )

  // endpoint to check registration status - สำหรับตรวจสอบสถานะการลงทะเบียน (ไม่ต้อง auth เพราะใช้ token)
  .post(
    "/register/check-status",
    validate(authSchemas.checkStatus),
    liffController.checkRegistrationStatus
  )

  // endpoint to forget - สร้างคำขอลืมลงเวลา
  .post(
    "/forget-request",
    auth,
    validate(attendanceSchemas.forgetTime),
    liffController.createForgetRequest
  )

  // endpoint to get missing timestamps
  .post(
    "/forget-request/missing",
    auth,
    // validate(authSchemas.checkStatus), // อาจจะต้องมี validation schema ใหม่ หรือใช้ checkStatus ถ้าแค่ check token/lineUserId
    liffController.getMissingTimestamps
  )

  // endpoint to check forget request info - ตรวจสอบข้อมูลคำขอ (สำหรับหน้าอนุมัติ)
  .post(
    "/forget-request/info",
    validate(authSchemas.checkStatus),
    liffController.getForgetRequestInfo
  )

  // endpoint to approve forget request - อนุมัติคำขอ
  .post(
    "/forget-request/approve",
    validate(authSchemas.approve),
    liffController.approveForgetRequest
  )

  // endpoint to company - สำหรับดึงข้อมูลบริษัททั้งหมด
  .get("/company", auth, liffController.getCompanies);

module.exports = router;
