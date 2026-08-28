-- =========================================================
-- GDevShop — Database schema (MySQL 8+)
-- Run: mysql -u <user> -p < schema.sql
-- =========================================================

CREATE DATABASE IF NOT EXISTS gdevshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gdevshop;

-- ---------------------------------------------------------
-- users: end customers (optional accounts; guest checkout allowed)
-- ---------------------------------------------------------
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,      -- bcrypt/argon2 hash only, never plaintext
  full_name VARCHAR(150),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- admin_users: dashboard operators
-- ---------------------------------------------------------
CREATE TABLE admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','operator','finance') NOT NULL DEFAULT 'operator',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- games: catalog of supported games
-- ---------------------------------------------------------
CREATE TABLE games (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  publisher VARCHAR(120),
  logo_url VARCHAR(500),
  requires_server_id TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- products: nominal/denomination options per game
-- ---------------------------------------------------------
CREATE TABLE products (
  id VARCHAR(40) PRIMARY KEY,               -- human-readable slug id, e.g. 'ml-172'
  game_id INT UNSIGNED NOT NULL,
  label VARCHAR(120) NOT NULL,              -- e.g. "172 Diamond"
  base_cost DECIMAL(12,2) NOT NULL,         -- cost from distributor
  markup_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL,             -- final sale price (base_cost + markup), server authoritative
  distributor_sku VARCHAR(100),             -- SKU/code used when calling the distributor API
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  INDEX idx_products_game (game_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- promotions: promo codes / featured cards
-- ---------------------------------------------------------
CREATE TABLE promotions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  game_id INT UNSIGNED,
  product_id VARCHAR(40),
  discount_type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12,2) NOT NULL,
  starts_at DATETIME,
  ends_at DATETIME,
  usage_limit INT UNSIGNED,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_promotions_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
  CONSTRAINT fk_promotions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- orders: the core transaction record
-- ---------------------------------------------------------
CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(40) UNIQUE NOT NULL,   -- e.g. GDS-20260828-1234
  user_id BIGINT UNSIGNED,                  -- nullable: guest checkout
  game_id INT UNSIGNED NOT NULL,
  product_id VARCHAR(40) NOT NULL,
  player_id VARCHAR(60) NOT NULL,
  server_id VARCHAR(30),
  contact VARCHAR(150) NOT NULL,
  price DECIMAL(12,2) NOT NULL,             -- snapshot of product.price at order time (server-resolved)
  service_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  promotion_id BIGINT UNSIGNED,
  payment_method VARCHAR(40) NOT NULL,
  status ENUM(
    'menunggu_pembayaran',
    'menunggu_verifikasi',
    'terverifikasi',
    'diproses',
    'berhasil',
    'gagal'
  ) NOT NULL DEFAULT 'menunggu_pembayaran',
  idempotency_key VARCHAR(100) UNIQUE,      -- prevents duplicate order creation for the same payment
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_game FOREIGN KEY (game_id) REFERENCES games(id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- payments: one row per payment attempt/intent tied to an order
-- ---------------------------------------------------------
CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  gateway_name VARCHAR(60) NOT NULL,        -- e.g. 'midtrans', 'xendit' — configure via env, not hardcoded logic
  gateway_payment_id VARCHAR(150) UNIQUE,   -- id returned by the gateway, used for idempotency
  method VARCHAR(40) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
  raw_response JSON,                        -- store gateway's raw response for audit (never store secrets here)
  verified_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payments_order (order_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- payment_logs: append-only audit trail of every payment event/webhook
-- ---------------------------------------------------------
CREATE TABLE payment_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED,
  event VARCHAR(60) NOT NULL,               -- e.g. 'webhook_received', 'signature_invalid', 'status_rechecked'
  payload JSON,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_logs_order (order_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- topup_logs: append-only audit trail of every distributor API call
-- ---------------------------------------------------------
CREATE TABLE topup_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  event VARCHAR(60) NOT NULL,               -- e.g. 'dispatched', 'success', 'failed', 'status_recheck'
  distributor_ref_id VARCHAR(150),
  payload JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_topup_logs_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_topup_logs_order (order_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- settings: single-row-per-key config (e.g. default markup)
-- ---------------------------------------------------------
CREATE TABLE settings (
  `key` VARCHAR(80) PRIMARY KEY,
  `value` VARCHAR(255) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO settings (`key`, `value`) VALUES
  ('default_markup_percent', '8'),
  ('service_fee_idr', '2500');
