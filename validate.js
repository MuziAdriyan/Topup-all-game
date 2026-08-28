const { AppError } = require("./errorHandler");

/**
 * Simple schema-less validator for order creation.
 * Swap for a full library (zod/joi) as the API grows — kept
 * dependency-light here so the shape of required checks is explicit.
 */
function validateCreateOrder(req, res, next) {
  const { gameSlug, playerId, serverId, productId, paymentMethod, contact } = req.body || {};

  if (!gameSlug || typeof gameSlug !== "string") {
    return next(new AppError("gameSlug wajib diisi.", 422, "VALIDATION_ERROR"));
  }
  if (!playerId || !/^[0-9]{4,20}$/.test(String(playerId))) {
    return next(new AppError("playerId tidak valid.", 422, "VALIDATION_ERROR"));
  }
  if (serverId !== undefined && serverId !== null && serverId !== "" && !/^[0-9]{1,10}$/.test(String(serverId))) {
    return next(new AppError("serverId tidak valid.", 422, "VALIDATION_ERROR"));
  }
  if (!productId || typeof productId !== "string") {
    return next(new AppError("productId wajib diisi.", 422, "VALIDATION_ERROR"));
  }
  if (!paymentMethod || typeof paymentMethod !== "string") {
    return next(new AppError("paymentMethod wajib diisi.", 422, "VALIDATION_ERROR"));
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRe = /^(\+62|62|0)8[0-9]{8,12}$/;
  if (!contact || !(emailRe.test(contact) || phoneRe.test(String(contact).replace(/[\s-]/g, "")))) {
    return next(new AppError("Kontak (email/nomor) tidak valid.", 422, "VALIDATION_ERROR"));
  }

  // IMPORTANT: price/nominal is intentionally NOT read from req.body here.
  // The controller must look up the authoritative price from the product
  // catalog (database) using productId — never trust a price sent by the client.
  next();
}

module.exports = { validateCreateOrder };
