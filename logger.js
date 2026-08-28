/**
 * Lightweight request logger + transaction logger helper.
 * In production, replace console output with a proper logger
 * (pino/winston) shipping to persistent storage — transaction
 * logs are required for reconciliation and dispute handling,
 * and should also be written to the `payment_logs` / `topup_logs`
 * tables (see database/schema.sql), not just stdout.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

/**
 * Call this from services whenever a transaction-relevant event happens
 * (payment created, webhook received, topup dispatched, topup result).
 * @param {string} event
 * @param {object} data - never log full card numbers, secrets, or raw credentials
 */
function logTransactionEvent(event, data = {}) {
  const safeData = { ...data };
  delete safeData.apiKey;
  delete safeData.secretKey;
  delete safeData.password;
  console.log(`[txn] ${event}`, JSON.stringify(safeData));
}

module.exports = { requestLogger, logTransactionEvent };
