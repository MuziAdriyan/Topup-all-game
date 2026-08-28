/**
 * Payment gateway integration.
 *
 * This file intentionally does NOT hardcode a real gateway's endpoint,
 * request/response shape, or signature scheme, because that must match
 * whichever licensed payment gateway (e.g. Midtrans, Xendit, DOKU, etc.)
 * you actually contract with — inventing one here would be misleading
 * and would not work in production.
 *
 * TO CONNECT A REAL GATEWAY:
 *   1. Set PAYMENT_GATEWAY_BASE_URL, PAYMENT_GATEWAY_API_KEY,
 *      PAYMENT_GATEWAY_SECRET_KEY, PAYMENT_GATEWAY_WEBHOOK_SECRET in .env
 *      (see .env.example).
 *   2. Replace the body of createPaymentIntent/getPaymentStatus with calls
 *      to that gateway's official SDK or documented REST API.
 *   3. Replace verifyWebhookSignature with the exact HMAC/signature
 *      algorithm specified in that gateway's webhook documentation.
 *   4. Never log full API keys/secrets (see middleware/logger.js).
 */

const APP_MODE = process.env.APP_MODE || "";

async function createPaymentIntent({ orderId, amount, method, contact }) {
  if (APP_MODE === "") {
    return {
      idempotencyKey: `-${orderId}`,
      instructions: {
        type: method,
      },
    };
  }

  if (!process.env.PAYMENT_GATEWAY_API_KEY || !process.env.PAYMENT_GATEWAY_BASE_URL) {
    throw new Error(
      "PAYMENT_GATEWAY_API_KEY / PAYMENT_GATEWAY_BASE_URL belum dikonfigurasi. " +
    );
  }

  // TODO(production): implement real call, e.g.
  //   const res = await fetch(`${process.env.PAYMENT_GATEWAY_BASE_URL}/v1/charge`, {
  //     method: "POST",
  //     headers: { Authorization: `Basic ${Buffer.from(process.env.PAYMENT_GATEWAY_API_KEY + ":").toString("base64")}` },
  //     body: JSON.stringify({ order_id: orderId, gross_amount: amount, payment_type: method, customer_contact: contact }),
  //   });
  //   return mapGatewayResponseToIntent(await res.json());
  throw new Error("Integrasi payment gateway production belum diimplementasikan.");
}

async function getPaymentStatus(orderId) {
  if (APP_MODE === "") {
    return { status: "unknown", note: "" };
  }
  // TODO(production): call the gateway's status endpoint directly (do not
  // rely solely on webhooks — this is the defense-in-depth recheck path).
  throw new Error("Integrasi payment gateway production belum diimplementasikan.");
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (APP_MODE === "") return false; 
  if (!process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET) {
    throw new Error("PAYMENT_GATEWAY_WEBHOOK_SECRET belum dikonfigurasi.");
  }
  // TODO(production): implement the exact signature algorithm documented by
  // your gateway, e.g.:
  //   const crypto = require("crypto");
  //   const expected = crypto.createHmac("sha512", process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET)
  //     .update(rawBody).digest("hex");
  //   return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader || ""));
  return false;
}

module.exports = { createPaymentIntent, getPaymentStatus, verifyWebhookSignature };
