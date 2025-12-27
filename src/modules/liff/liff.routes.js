// src/modules/liff/liff.routes.js

const express = require("express");
const router = express.Router();

// import middlewares validation and controller
const auth = require("../../shared/middlewares/auth.middleware");
const { validate } = require("../../shared/middlewares/validate.middleware");
const liffController = require("./liff.controller");

// LIFF routes
router
    // endpoint to register - สำหรับลงทะเบียนสมาชิก
    .post("/register", auth, validate(validate.authSchemas), liffController.register)

    // endpoint to forget - สำหรับแจ้งลืมลงเวลางาน
    .post("/forget-time", auth, validate(validate.authSchemas), liffController.forgetTime)

    // test endpoint
    .get("/test", auth, (_req, res) => {
        res.status(200).json({ status: "success", message: "LIFF test endpoint is working!" });
    });

module.exports = router;
    
