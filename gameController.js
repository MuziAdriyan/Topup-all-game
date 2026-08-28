const { AppError } = require("../middleware/errorHandler");

/**
 * DEMO catalog used only when no database is connected (APP_MODE=demo).
 * In production this MUST be replaced by real queries against the
 * `games` and `products` tables (see database/schema.sql), so prices
 * can be managed from the admin dashboard instead of hardcoded here.
 */
const DEMO_GAMES = [
  { slug: "mobile-legends", name: "Mobile Legends", publisher: "Moonton", hasServerId: true },
  { slug: "free-fire", name: "Free Fire", publisher: "Garena", hasServerId: false },
  { slug: "pubg-mobile", name: "PUBG Mobile", publisher: "Krafton", hasServerId: false },
  { slug: "valorant", name: "Valorant", publisher: "Riot Games", hasServerId: false },
  { slug: "roblox", name: "Roblox", publisher: "Roblox Corp", hasServerId: false },
  { slug: "genshin-impact", name: "Genshin Impact", publisher: "HoYoverse", hasServerId: true },
  { slug: "honor-of-kings", name: "Honor of Kings", publisher: "TiMi Studio", hasServerId: true },
  { slug: "cod-mobile", name: "Call of Duty Mobile", publisher: "Activision", hasServerId: false },
];

const DEMO_PRODUCTS = {
  "mobile-legends": [
    { id: "ml-86", label: "86 Diamond", price: 22000 },
    { id: "ml-172", label: "172 Diamond", price: 43000 },
    { id: "ml-257", label: "257 Diamond", price: 64000 },
  ],
  "free-fire": [
    { id: "ff-70", label: "70 Diamond", price: 11000 },
    { id: "ff-140", label: "140 Diamond", price: 22000 },
  ],
};

async function listGames(req, res, next) {
  try {
    // TODO(production): SELECT * FROM games WHERE is_active = 1 ORDER BY sort_order
    res.json({ data: DEMO_GAMES });
  } catch (err) { next(err); }
}

async function getGame(req, res, next) {
  try {
    const game = DEMO_GAMES.find((g) => g.slug === req.params.slug);
    if (!game) throw new AppError("Game tidak ditemukan.", 404, "NOT_FOUND");
    res.json({ data: game });
  } catch (err) { next(err); }
}

async function listProducts(req, res, next) {
  try {
    const game = DEMO_GAMES.find((g) => g.slug === req.params.slug);
    if (!game) throw new AppError("Game tidak ditemukan.", 404, "NOT_FOUND");
    // TODO(production): SELECT id, label, price FROM products WHERE game_id = ? AND is_active = 1
    // Price here is the ONLY source of truth used later by orderController.
    const products = DEMO_PRODUCTS[req.params.slug] || [];
    res.json({ data: products });
  } catch (err) { next(err); }
}

module.exports = { listGames, getGame, listProducts };
