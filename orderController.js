const { AppError } = require("../middleware/errorHandler");
const { logTransactionEvent } = require("../middleware/logger");
const paymentGatewayService = require("../services/paymentGatewayService");
const { getProductPrice } = require("../services/catalogService");

/**
 * In-memory demo store. Replace entirely with the `orders` / `payments`
 * tables in production — this object is NOT persistent and NOT safe for
 * concurrent instances.
 */
const demoOrders = new Map();

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GDS-${date}-${rand}`;
}

/**
 * POST /api/orders
 * Flow: validate input -> look up authoritative price server-side ->
 * create order (status: menunggu_pembayaran) -> create payment intent
 * with the gateway -> return payment instructions to the client.
 *
 * The order is NEVER marked paid here. Only the verified webhook
 * (paymentController.handleWebhook) may advance the order past
 * "menunggu_pembayaran".
 */
async function createOrder(req, res, next) {
  try {
    const { gameSlug, playerId, serverId, productId, paymentMethod, contact } = req.body;

    // Authoritative price lookup — never trust a price field from the client.
    const product = await getProductPrice(gameSlug, productId);
    if (!product) throw new AppError("Produk tidak ditemukan atau tidak aktif.", 404, "PRODUCT_NOT_FOUND");

    const serviceFee = Number(process.env.SERVICE_FEE_IDR || 2500);
    const total = product.price + serviceFee;

    const order = {
      orderId: generateOrderId(),
      gameSlug,
      productId,
      playerId,
      serverId: serverId || null,
      paymentMethod,
      contact,
      price: product.price,
      fee: serviceFee,
      total,
      status: "menunggu_pembayaran",
      idempotencyKey: null, // set once the gateway returns its intent id
      createdAt: new Date().toISOString(),
    };

    // TODO(production): INSERT INTO orders (...) VALUES (...) inside a transaction.
    demoOrders.set(order.orderId, order);
    logTransactionEvent("order_created", { orderId: order.orderId, total: order.total });

    // Create a payment intent with the gateway. This call must use the
    // real gateway SDK/API in production — see paymentGatewayService.js.
    const intent = await paymentGatewayService.createPaymentIntent({
      orderId: order.orderId,
      amount: order.total,
      method: order.paymentMethod,
      contact: order.contact,
    });

    order.idempotencyKey = intent.idempotencyKey;
    demoOrders.set(order.orderId, order);

    res.status(201).json({
      data: {
        orderId: order.orderId,
        total: order.total,
        status: order.status,
        paymentInstructions: intent.instructions, // e.g. QR string, VA number — from gateway, not invented here
      },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/orders/:orderId
 * Public status lookup — returns only non-sensitive fields.
 */
async function getOrderStatus(req, res, next) {
  try {
    // TODO(production): SELECT status, game, product, total FROM orders WHERE order_id = ?
    const order = demoOrders.get(req.params.orderId);
    if (!order) throw new AppError("Pesanan tidak ditemukan.", 404, "NOT_FOUND");

    res.json({
      data: {
        orderId: order.orderId,
        status: order.status,
        gameSlug: order.gameSlug,
        total: order.total,
        createdAt: order.createdAt,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { createOrder, getOrderStatus, _demoOrders: demoOrders };
    
