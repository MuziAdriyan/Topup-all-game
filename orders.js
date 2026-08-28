const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { validateCreateOrder } = require("../middleware/validate");

// POST /api/orders — create order + payment intent (price resolved server-side)
router.post("/", validateCreateOrder, orderController.createOrder);

// GET /api/orders/:orderId — public status lookup (no sensitive data returned)
router.get("/:orderId", orderController.getOrderStatus);

module.exports = router;
