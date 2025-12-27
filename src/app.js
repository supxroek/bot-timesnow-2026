const express = require("express");
const router = express.Router();

// Import routes
const webhookRoutes = require("./modules/webhook/webhook");
const liffRoutes = require("./modules/liff/liff.routes");

// Import middlewares
const lineSignature = require("./shared/middlewares/line-signature");

// API Version prefix
const API_VERSION = "/api";

router.use(`${API_VERSION}/webhooks`, lineSignature, webhookRoutes.handleEvent.bind(webhookRoutes));
router.use(`${API_VERSION}/liff`, liffRoutes);

module.exports = router;
