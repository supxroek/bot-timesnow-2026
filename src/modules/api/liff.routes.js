// src/modules/liff/liff.routes.js

const express = require("express");
const router = express.Router();

// import middlewares validation and controller
const auth = require("../../shared/middlewares/auth.middleware");
const { validate, authSchemas, attendanceSchemas  } = require("../../shared/middlewares/validate.middleware");
const liffController = require("./liff.controller");

// LIFF routes
router
    // endpoint to register - สำหรับลงทะเบียนสมาชิก
    .post("/register", auth, validate(authSchemas.register), liffController.register)

    // endpoint to forget - สำหรับแจ้งลืมลงเวลางาน
    .post("/forget-time", auth, validate(attendanceSchemas.forgetTime), liffController.forgetTime)

    // endpoint to company - สำหรับดึงข้อมูลบริษัททั้งหมด
    .get("/company", auth, liffController.getCompanies);

module.exports = router;
    
