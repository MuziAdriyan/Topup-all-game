/**
 * Centralized error handler. Never leak stack traces or internal details
 * (DB errors, gateway raw responses) to the client in production.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isProd = (process.env.NODE_ENV || "development") === "production";

  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err.message);
  if (!isProd) console.error(err.stack);

  res.status(status).json({
    error: err.code || "INTERNAL_ERROR",
    message: isProd && status === 500 ? "Terjadi kesalahan pada server." : err.message,
  });
}

class AppError extends Error {
  constructor(message, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { errorHandler, AppError };
