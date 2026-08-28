/**
 * GDevShop backend — Express entry point.
 *
 * SECURITY NOTES (read before deploying to production):
 * - All secrets (payment gateway keys, distributor API keys, DB credentials,
 *   JWT secret) MUST live in environment variables (.env), never hardcoded
 *   and never sent to the frontend. See .env.example for the required keys.
 * - This file wires global middleware only: helmet, CORS, JSON body parsing,
 *   rate limiting, and request logging. Business logic lives in
 *   controllers/services, not here.
 * - Nothing in this codebase invents real API endpoints, keys, or gateway
 *   response formats. Every external integration point is a clearly marked
 *   placeholder — see services/paymentGatewayService.js and
 *   services/topupApiService.js.
 */

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const gamesRoutes = require("./routes/games");
const ordersRoutes = require("./routes/orders");
const paymentsRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const { errorHandler } = require("./middleware/errorHandler");
const { requestLogger } = require("./middleware/logger");

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_MODE = process.env.APP_MODE || "demo"; // "demo" | "production"

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "200kb" }));
app.use(requestLogger);

// Global rate limit — tune per-route limits (e.g. payments) inside their routers.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: APP_MODE, env: NODE_ENV });
});

app.use("/api/games", gamesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "NOT_FOUND", message: "Endpoint tidak ditemukan." }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GDevShop backend running on port ${PORT} [mode=${APP_MODE}, env=${NODE_ENV}]`);
  if (APP_MODE === "production") {
    console.log("Production mode active — verify PAYMENT_GATEWAY_* and TOPUP_API_* env vars are set before accepting real traffic.");
  }
});

module.exports = app;
