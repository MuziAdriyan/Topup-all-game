const { AppError } = require("./errorHandler");

/**
 * Placeholder auth guard for /api/admin/*.
 * Replace with real session/JWT verification against the `admin_users`
 * table (hashed passwords only — bcrypt/argon2, never plaintext).
 * TODO before production:
 *   1. Implement login endpoint issuing a signed JWT (JWT_SECRET from .env).
 *   2. Verify token here, attach req.admin = { id, role }.
 *   3. Add role checks for sensitive actions (e.g. changing markup, refunds).
 */
function requireAdminAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return next(new AppError("Autentikasi admin diperlukan.", 401, "UNAUTHORIZED"));
  }
  // TODO: verify JWT using process.env.JWT_SECRET, attach req.admin.
  // This placeholder intentionally does NOT accept any token as valid.
  return next(new AppError("Verifikasi token admin belum dikonfigurasi.", 501, "NOT_IMPLEMENTED"));
}

module.exports = { requireAdminAuth };
