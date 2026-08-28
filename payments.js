const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const paymentController = require("../controllers/paymentController");

// Stricter limiter for payment-related endpoints.
const paymentLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

// POST /api/payments/webhook — called by the payment gateway ONLY.
// Must verify signature before trusting any payload (see paymentController).
router.post("/webhook", paymentController.handleWebhook);

// GET /api/payments/:orderId/status — re-check status directly against the gateway
router.get("/:orderId/status", paymentLimiter, paymentController.checkPaymentStatus);

module.exports = router;
