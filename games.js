const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// GET /api/games — list all active games
router.get("/", gameController.listGames);

// GET /api/games/:slug — game detail
router.get("/:slug", gameController.getGame);

// GET /api/games/:slug/products — nominal/product list with authoritative prices
router.get("/:slug/products", gameController.listProducts);

module.exports = router;
