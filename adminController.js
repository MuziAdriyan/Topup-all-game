const { AppError } = require("../middleware/errorHandler");
const { _demoOrders: Orders } = require("./orderController");

/**
 * All handlers below use the in-memory store as a placeholder.
 * Production implementation should query the database directly
 * (see database/schema.sql) with proper pagination.
 */

async function getSummary(req, res, next) {
  try {
    const orders = [...demoOrders.values()];
    const summary = {
      totalTransactions: orders.length,
      totalRevenue: orders.filter(o => o.status === "berhasil").reduce((s, o) => s + o.total, 0),
      successCount: orders.filter(o => o.status === "berhasil").length,
      pendingCount: orders.filter(o => ["menunggu_pembayaran", "menunggu_verifikasi", "terverifikasi", "diproses"].includes(o.status)).length,
      failedCount: orders.filter(o => o.status === "gagal").length,
    };
    res.json({ data: summary });
  } catch (err) { next(err); }
}

async function listOrders(req, res, next) {
  try {
    const orders = [...demoOrders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ data: orders });
  } catch (err) { next(err); }
}

async function getOrderDetail(req, res, next) {
  try {
    const order = Orders.get(req.params.orderId);
    if (!order) throw new AppError("Pesanan tidak ditemukan.", 404, "NOT_FOUND");
    res.json({ data: order });
  } catch (err) { next(err); }
}

async function recheckOrderStatus(req, res, next) {
  try {
    // TODO(production): call paymentGatewayService.getPaymentStatus and/or
    // topupApiService.checkTopupStatus, then reconcile local order status.
    res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke payment gateway/API distributor resmi terlebih dahulu." });
  } catch (err) { next(err); }
}

async function listProducts(req, res, next) {
  res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke tabel products." });
}
async function updateProduct(req, res, next) {
  res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke tabel products." });
}
async function updateMarkup(req, res, next) {
  res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke tabel pengaturan markup." });
}
async function listPromotions(req, res, next) {
  res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke tabel promotions." });
}
async function createPromotion(req, res, next) {
  res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke tabel promotions." });
}
async function getApiStatus(req, res, next) {
  res.json({
    data: {
      paymentGateway: process.env.PAYMENT_GATEWAY_API_KEY ? "configured" : "not_configured",
      topupDistributor: process.env.TOPUP_API_KEY ? "configured" : "not_configured",
    },
  });
}
async function listLogs(req, res, next) {
  res.status(501).json({ error: "NOT_IMPLEMENTED", message: "Hubungkan ke tabel payment_logs/topup_logs." });
}

module.exports = {
  getSummary, listOrders, getOrderDetail, recheckOrderStatus,
  listProducts, updateProduct, updateMarkup,
  listPromotions, createPromotion,
  getApiStatus, listLogs,
};
