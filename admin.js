const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdminAuth } = require("../middleware/auth");

router.use(requireAdminAuth);

// Dashboard summary: totals, revenue, success/pending/failed counts
router.get("/summary", adminController.getSummary);

// Transactions
router.get("/orders", adminController.listOrders);
router.get("/orders/:orderId", adminController.getOrderDetail);
router.post("/orders/:orderId/recheck", adminController.recheckOrderStatus);

// Catalog management
router.get("/products", adminController.listProducts);
router.put("/products/:id", adminController.updateProduct);
router.put("/settings/markup", adminController.updateMarkup);

// Promotions
router.get("/promotions", adminController.listPromotions);
router.post("/promotions", adminController.createPromotion);

// Integration health + logs
router.get("/api-status", adminController.getApiStatus);
router.get("/logs", adminController.listLogs);

module.exports = router;
