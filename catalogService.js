/**
 * Authoritative product/price lookup. orderController calls this instead
 * of trusting any price sent by the client.
 *
 * TODO(production): replace with a real query, e.g.:
 *   SELECT p.id, p.label, p.price
 *   FROM products p JOIN games g ON g.id = p.game_id
 *   WHERE g.slug = ? AND p.id = ? AND p.is_active = 1 AND g.is_active = 1
 */
const PRODUCTS = {
  "mobile-legends": { "ml-86": { label: "86 Diamond", price: 22000 }, "ml-172": { label: "172 Diamond", price: 43000 } },
  "free-fire": { "ff-70": { label: "70 Diamond", price: 11000 }, "ff-140": { label: "140 Diamond", price: 22000 } },
};

async function getProductPrice(gameSlug, productId) {
  const game = PRODUCTS[gameSlug];
  if (!game) return null;
  const product = game[productId];
  if (!product) return null;
  return { id: productId, ...product };
}

module.exports = { getProductPrice };
