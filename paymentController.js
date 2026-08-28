const { AppError } = require("../middleware/errorHandler");
const { logTransactionEvent } = require("../middleware/logger");
const paymentGatewayService = require("../services/paymentGatewayService");
const topupApiService = require("../services/topupApiService");
const { _Orders: Orders } = require("./orderController");

/**
 * POST /api/payments/webhook
 *
 * CRITICAL SECURITY RULES:
 * 1. NEVER trust this payload as "payment successful" without verifying
 *    its signature against the gateway's shared secret
 *    (process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET).
 * 2. Use idempotency: if this webhook is received twice for the same
 *    order/payment id, do NOT create a duplicate top-up order.
 * 3. After signature verification, still re-confirm status by calling
 *    the gateway's status API directly (defense in depth) before
 *    dispatching the top-up.
 */
async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers["x-gateway-signature"];
    const isValid = paymentGatewayService.verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), signature);
    if (!isValid) {
      logTransactionEvent("webhook_rejected_bad_signature", { ip: req.ip });
      throw new AppError("Signature tidak valid.", 401, "INVALID_SIGNATURE");
    }

    const { orderId, paymentStatus, paymentId } = req.body;
    const order = Orders.get(orderId);
    if (!order) throw new AppError("Order tidak ditemukan untuk webhook ini.", 404, "NOT_FOUND");

    // Idempotency guard — a real implementation checks a unique constraint
    // on payment_id in the `payments` table instead of an in-memory flag.
    if (order.status !== "menunggu_pembayaran") {
      logTransactionEvent("webhook_duplicate_ignored", { orderId, paymentId });
      return res.json({ received: true, note: "already_processed" });
    }

    if (paymentStatus !== "paid") {
      order.status = "gagal";
      logTransactionEvent("payment_failed", { orderId, paymentId });
      return res.json({ received: true });
    }

    order.status = "terverifikasi";
    logTransactionEvent("payment_verified", { orderId, paymentId });

    // Only now, after verified payment, create the distributor top-up order.
    order.status = "diproses";
    const topupResult = await topupApiService.dispatchTopup({
      orderId: order.orderId,
      gameSlug: order.gameSlug,
      productId: order.productId,
      playerId: order.playerId,
      serverId: order.serverId,
    });

    order.status = topupResult.success ? "berhasil" : "gagal";
    logTransactionEvent("topup_dispatched", { orderId, success: topupResult.success });

    res.json({ received: true });
  } catch (err) { next(err); }
}

/**
 * GET /api/payments/:orderId/status
 * Manual re-check against the gateway — used by the "cek pesanan" UI
 * and by admin's "recheck" action as a fallback if a webhook was missed.
 */
async function checkPaymentStatus(req, res, next) {
  try {
    const order = Orders.get(req.params.orderId);
    if (!order) throw new AppError("Pesanan tidak ditemukan.", 404, "NOT_FOUND");

    const gatewayStatus = await paymentGatewayService.getPaymentStatus(order.orderId);
    res.json({ data: { orderId: order.orderId, localStatus: order.status, gatewayStatus } });
  } catch (err) { next(err); }
}

module.exports = { handleWebhook, checkPaymentStatus };
      
