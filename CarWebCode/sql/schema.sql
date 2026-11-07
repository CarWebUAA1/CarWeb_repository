-- =====================================================================
-- CarWeb: car buying and selling system
-- Schema for MySQL 8.0.16+ (CHECK constraints are only enforced from 8.0.16).
-- Run in MySQL Workbench with "Execute All" (Ctrl + Shift + Enter).
--
-- Customers have NO account: their name, phone and email are stored only in
-- `appointments`. Test drives and trades link to the appointment they came
-- from, and the customer's data is read from there.
--
-- Foreign keys: all ON DELETE RESTRICT ON UPDATE RESTRICT (records with
-- history cannot be deleted; AUTO_INCREMENT keys never change). The only
-- exception is documents.trade_id (ON DELETE CASCADE).
-- MySQL forbids CASCADE / SET NULL on a column used by a CHECK (error 3823)
-- or by a STORED generated column, which is another reason to use RESTRICT.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS carweb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE carweb;


-- ---------------------------------------------------------------------
-- employees: staff users. Same access fields as managers.
-- ---------------------------------------------------------------------
CREATE TABLE employees (
  employee_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(100) NOT NULL,
  phone            VARCHAR(15)  NOT NULL,
  email            VARCHAR(255) NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,              -- bcrypt hash, never the password
  failed_attempts  TINYINT UNSIGNED NOT NULL DEFAULT 0, -- login lockout: 3 attempts
  locked_until     DATETIME NULL,                      -- ...then locked for 15 minutes
  last_activity    DATETIME NULL,                      -- session expires by inactivity
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_employees PRIMARY KEY (employee_id),
  CONSTRAINT uq_employees_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Employees with system access';


-- ---------------------------------------------------------------------
-- managers: same access fields as employees; they approve trades and
-- record stock movements.
-- ---------------------------------------------------------------------
CREATE TABLE managers (
  manager_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(100) NOT NULL,
  phone            VARCHAR(15)  NOT NULL,
  email            VARCHAR(255) NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,              -- bcrypt hash, never the password
  failed_attempts  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until     DATETIME NULL,
  last_activity    DATETIME NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_managers PRIMARY KEY (manager_id),
  CONSTRAINT uq_managers_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Managers with system access';


-- ---------------------------------------------------------------------
-- cars: dealership inventory (for sale, reserved, sold, spare parts...).
-- ---------------------------------------------------------------------
CREATE TABLE cars (
  car_id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vin                   CHAR(17)     NOT NULL,
  plates                VARCHAR(10)  NULL,               -- UNIQUE allows several NULLs
  brand                 VARCHAR(50)  NOT NULL,
  model                 VARCHAR(50)  NOT NULL,
  year                  SMALLINT     NOT NULL,
  version               VARCHAR(50)  NULL,
  series                VARCHAR(50)  NULL,
  mileage               INT UNSIGNED NOT NULL DEFAULT 0,
  fuel_type             ENUM('Gasoline','Diesel','Hybrid','Electric') NOT NULL,
  transmission          ENUM('Manual','Automatic') NOT NULL,
  color                 VARCHAR(30)  NOT NULL,
  status                ENUM('Available','Reserved','Sold','In test drive','Out of service','Pending evaluation','Spare parts')
                        NOT NULL DEFAULT 'Available',
  tire_condition        ENUM('Good','Fair','Poor') NULL,
  service_history       TEXT NULL,
  purchase_price        DECIMAL(12,2) NULL,
  base_price            DECIMAL(12,2) NULL,
  sale_price            DECIMAL(12,2) NULL,
  test_drive_authorized BOOLEAN NOT NULL DEFAULT TRUE,
  photos                JSON NULL,                       -- list of photo URLs
  inventory_status      ENUM('In stock','Out of stock') NOT NULL DEFAULT 'In stock',
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_cars PRIMARY KEY (car_id),
  CONSTRAINT uq_cars_vin UNIQUE (vin),
  CONSTRAINT uq_cars_plates UNIQUE (plates),
  -- Fixed bounds: a CHECK cannot use NOW()/CURDATE().
  CONSTRAINT chk_cars_year CHECK (year BETWEEN 1990 AND 2100),
  -- Each price is optional, but if present it must be positive.
  CONSTRAINT chk_cars_purchase_price CHECK (purchase_price IS NULL OR purchase_price > 0),
  CONSTRAINT chk_cars_base_price     CHECK (base_price IS NULL OR base_price > 0),
  CONSTRAINT chk_cars_sale_price     CHECK (sale_price IS NULL OR sale_price > 0),
  INDEX idx_cars_status_created_at (status, created_at),  -- public catalog, newest first
  INDEX idx_cars_brand_model (brand, model)               -- brand/model filter (US-04)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Dealership car inventory';


-- ---------------------------------------------------------------------
-- spare_parts: parts sold separately. Cars has SpareParts (1 to N).
-- ---------------------------------------------------------------------
CREATE TABLE spare_parts (
  part_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  car_id           INT UNSIGNED NULL,                   -- car the part came from, if known
  brand            VARCHAR(50)  NOT NULL,               -- compatible brand
  model            VARCHAR(50)  NOT NULL,               -- compatible model
  status           ENUM('Available','Reserved','Sold') NOT NULL DEFAULT 'Available',
  price            DECIMAL(12,2) NOT NULL,
  inventory_status ENUM('In stock','Out of stock') NOT NULL DEFAULT 'In stock',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_spare_parts PRIMARY KEY (part_id),
  CONSTRAINT chk_spare_parts_price CHECK (price > 0),
  CONSTRAINT fk_spare_parts_car FOREIGN KEY (car_id) REFERENCES cars (car_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_spare_parts_car_id (car_id),
  INDEX idx_spare_parts_brand_model (brand, model)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Spare parts, optionally taken from a car';


-- ---------------------------------------------------------------------
-- stock_movements: every car or spare part that enters or leaves.
-- Append-only: a mistake is fixed with an opposite movement (see the
-- triggers at the end of this file).
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
  movement_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  car_id         INT UNSIGNED NULL,
  spare_part_id  INT UNSIGNED NULL,
  manager_id     INT UNSIGNED NOT NULL,                 -- who recorded it
  movement_type  ENUM('In','Out') NOT NULL,
  reason         ENUM('Purchase','Sale','Transfer','Return','Spare parts') NOT NULL,
  movement_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_stock_movements PRIMARY KEY (movement_id),
  -- Exactly one item per movement: a car OR a spare part.
  CONSTRAINT chk_stock_movements_one_item CHECK ((car_id IS NULL) <> (spare_part_id IS NULL)),
  CONSTRAINT fk_stock_movements_car FOREIGN KEY (car_id) REFERENCES cars (car_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_stock_movements_spare_part FOREIGN KEY (spare_part_id) REFERENCES spare_parts (part_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_stock_movements_manager FOREIGN KEY (manager_id) REFERENCES managers (manager_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_stock_movements_car_id (car_id),
  INDEX idx_stock_movements_spare_part_id (spare_part_id),
  INDEX idx_stock_movements_manager_id (manager_id),
  INDEX idx_stock_movements_movement_date (movement_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Append-only log of stock in/out';


-- ---------------------------------------------------------------------
-- appointments: the ONLY table with customer data (customers have no
-- account). They manage their appointment through an emailed link.
-- ---------------------------------------------------------------------
CREATE TABLE appointments (
  appointment_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_name          VARCHAR(100) NOT NULL,
  client_phone         VARCHAR(15)  NOT NULL,
  client_email         VARCHAR(255) NOT NULL,           -- confirmation + manage link
  -- SHA-256 (64 hex chars) of the token in the "modify or cancel" link.
  -- The original token is never stored.
  manage_token_hash    CHAR(64)     NOT NULL,
  employee_id          INT UNSIGNED NULL,               -- "is assigned to", set when confirmed
  car_id               INT UNSIGNED NULL,               -- "subject"; a sale evaluation may have no car yet
  decision_by          INT UNSIGNED NULL,               -- employee who confirmed or rejected
  appointment_type     ENUM('Viewing','Test drive','Purchase','Sale evaluation') NOT NULL,
  appointment_datetime DATETIME NOT NULL,
  status               ENUM('Pending','Confirmed','Rejected','Cancelled','Completed','No show')
                       NOT NULL DEFAULT 'Pending',
  cancel_reason        VARCHAR(255) NULL,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_appointments PRIMARY KEY (appointment_id),
  CONSTRAINT uq_appointments_manage_token_hash UNIQUE (manage_token_hash),
  -- The same email cannot book two appointments at the same time.
  CONSTRAINT uq_appointments_client_email_datetime UNIQUE (client_email, appointment_datetime),
  CONSTRAINT fk_appointments_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_appointments_car FOREIGN KEY (car_id) REFERENCES cars (car_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_appointments_decision_by FOREIGN KEY (decision_by) REFERENCES employees (employee_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_appointments_employee_id (employee_id),
  INDEX idx_appointments_car_id (car_id),
  INDEX idx_appointments_decision_by (decision_by),
  INDEX idx_appointments_appointment_datetime (appointment_datetime),
  -- client_email is also the leftmost column of uq_appointments_client_email_datetime;
  -- this index is kept because the specification asks for it explicitly.
  INDEX idx_appointments_client_email (client_email),
  INDEX idx_appointments_client_phone (client_phone)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Customer appointments; only place where customer data lives';


-- ---------------------------------------------------------------------
-- test_drives: a test drive comes from one "Test drive" appointment,
-- where the customer's data is.
-- ---------------------------------------------------------------------
CREATE TABLE test_drives (
  test_drive_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_id  INT UNSIGNED NOT NULL,
  employee_id     INT UNSIGNED NOT NULL,                -- "accompanies"
  car_id          INT UNSIGNED NOT NULL,                -- "is driven in"
  schedule_start  DATETIME NOT NULL,
  schedule_end    DATETIME NOT NULL,
  start_time      DATETIME NULL,                        -- actual start
  end_time        DATETIME NULL,                        -- actual end
  observations    TEXT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_test_drives PRIMARY KEY (test_drive_id),
  -- One test drive per appointment (1 to 1).
  CONSTRAINT uq_test_drives_appointment_id UNIQUE (appointment_id),
  CONSTRAINT chk_test_drives_schedule CHECK (schedule_end > schedule_start),
  CONSTRAINT chk_test_drives_actual_times CHECK (start_time IS NULL OR end_time IS NULL OR end_time >= start_time),
  CONSTRAINT fk_test_drives_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_test_drives_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_test_drives_car FOREIGN KEY (car_id) REFERENCES cars (car_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  -- appointment_id is indexed by uq_test_drives_appointment_id.
  INDEX idx_test_drives_employee_id (employee_id),
  -- Also covers the car_id foreign key. Used to detect overlapping schedules.
  INDEX idx_test_drives_car_id_schedule_start (car_id, schedule_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Test drives, one per test-drive appointment';


-- ---------------------------------------------------------------------
-- inspections: mechanical/body inspections of a car (1 car to N).
-- ---------------------------------------------------------------------
CREATE TABLE inspections (
  inspection_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  car_id               INT UNSIGNED NOT NULL,           -- "is inspected in"
  inspection_date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mechanical_condition ENUM('Good','Fair','Poor') NOT NULL,
  exterior_condition   ENUM('Good','Fair','Poor') NOT NULL,
  interior_condition   ENUM('Good','Fair','Poor') NOT NULL,
  faults               TEXT NULL,
  damage               TEXT NULL,
  observations         TEXT NULL,
  photos               JSON NULL,                       -- list of photo URLs
  result               ENUM('Fit for sale','Needs repair','Spare parts only') NOT NULL,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_inspections PRIMARY KEY (inspection_id),
  CONSTRAINT fk_inspections_car FOREIGN KEY (car_id) REFERENCES cars (car_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_inspections_car_id (car_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Car inspections';


-- ---------------------------------------------------------------------
-- trades: a purchase or sale started in an appointment (customer data
-- comes from there). Purchase = the customer buys from the dealership;
-- Sale = the customer sells to the dealership.
-- ---------------------------------------------------------------------
CREATE TABLE trades (
  trade_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_id   INT UNSIGNED NOT NULL,
  employee_id      INT UNSIGNED NOT NULL,               -- "is responsible for"
  manager_id       INT UNSIGNED NULL,                   -- "approves or rejects", set on decision
  car_id           INT UNSIGNED NULL,                   -- "is traded in"
  spare_part_id    INT UNSIGNED NULL,                   -- "is sold in"
  trade_type       ENUM('Purchase','Sale') NOT NULL,
  status           ENUM('In progress','Pending approval','Completed','Rejected','Cancelled')
                   NOT NULL DEFAULT 'In progress',
  price            DECIMAL(12,2) NULL,                  -- final agreed price
  estimated_price  DECIMAL(12,2) NULL,
  listing_price    DECIMAL(12,2) NULL,
  trade_date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_price_edit  DATETIME NULL,
  reserved_until   DATETIME NULL,                       -- reservation expires after 72 hours
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  -- MySQL has no partial indexes. This column holds car_id only while the trade
  -- is active (NULL otherwise); a UNIQUE index on it allows many NULLs, so a car
  -- can have many inactive trades but only ONE active trade.
  active_car_id    INT UNSIGNED GENERATED ALWAYS AS (IF(is_active, car_id, NULL)) STORED,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_trades PRIMARY KEY (trade_id),
  CONSTRAINT uq_trades_active_car_id UNIQUE (active_car_id),
  -- Exactly one item per trade: a car OR a spare part.
  CONSTRAINT chk_trades_one_item CHECK ((car_id IS NULL) <> (spare_part_id IS NULL)),
  -- The dealership never buys spare parts from customers: a spare part trade is a Purchase.
  CONSTRAINT chk_trades_spare_part_purchase CHECK (spare_part_id IS NULL OR trade_type = 'Purchase'),
  CONSTRAINT chk_trades_price           CHECK (price IS NULL OR price > 0),
  CONSTRAINT chk_trades_estimated_price CHECK (estimated_price IS NULL OR estimated_price > 0),
  CONSTRAINT chk_trades_listing_price   CHECK (listing_price IS NULL OR listing_price > 0),
  -- The 72-hour reservation is relative to trade_date (a CHECK cannot use NOW()).
  CONSTRAINT chk_trades_reserved_until CHECK (
    reserved_until IS NULL
    OR (reserved_until > trade_date AND reserved_until <= trade_date + INTERVAL 72 HOUR)
  ),
  CONSTRAINT fk_trades_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_trades_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_trades_manager FOREIGN KEY (manager_id) REFERENCES managers (manager_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_trades_car FOREIGN KEY (car_id) REFERENCES cars (car_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_trades_spare_part FOREIGN KEY (spare_part_id) REFERENCES spare_parts (part_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_trades_appointment_id (appointment_id),
  INDEX idx_trades_employee_id (employee_id),
  INDEX idx_trades_manager_id (manager_id),
  INDEX idx_trades_car_id (car_id),
  INDEX idx_trades_spare_part_id (spare_part_id),
  INDEX idx_trades_status (status),
  INDEX idx_trades_trade_date (trade_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Purchases and sales, linked to their appointment';


-- ---------------------------------------------------------------------
-- documents: paperwork required by a trade (1 trade to N).
-- ---------------------------------------------------------------------
CREATE TABLE documents (
  document_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  trade_id       INT UNSIGNED NOT NULL,                 -- "requires"
  document_type  ENUM('Official ID','Proof of address','Invoice or title','Registration card','No-debt proof') NOT NULL,
  status         ENUM('Pending','Received','Rejected') NOT NULL DEFAULT 'Pending',
  received_date  DATETIME NULL,
  file_path      VARCHAR(255) NULL,                     -- path of the scanned file
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_documents PRIMARY KEY (document_id),
  -- One document of each type per trade. Also indexes trade_id (leftmost column).
  CONSTRAINT uq_documents_trade_id_document_type UNIQUE (trade_id, document_type),
  -- The only CASCADE in the schema: documents belong to their trade.
  -- Allowed because trade_id is not used by any CHECK or generated column.
  CONSTRAINT fk_documents_trade FOREIGN KEY (trade_id) REFERENCES trades (trade_id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Documents required by each trade';


-- ---------------------------------------------------------------------
-- contracts: one contract per trade (1 to 1). Key = contract number.
-- ---------------------------------------------------------------------
CREATE TABLE contracts (
  contract_number  VARCHAR(20) NOT NULL,                -- format CT-2026-0001
  trade_id         INT UNSIGNED NOT NULL,               -- "is covered by"
  generated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pdf_path         VARCHAR(255) NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_contracts PRIMARY KEY (contract_number),
  CONSTRAINT uq_contracts_trade_id UNIQUE (trade_id),  -- also indexes the foreign key
  CONSTRAINT fk_contracts_trade FOREIGN KEY (trade_id) REFERENCES trades (trade_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Contract of each trade';


-- ---------------------------------------------------------------------
-- receipts: one receipt per trade (1 to 1). Key = receipt number.
-- ---------------------------------------------------------------------
CREATE TABLE receipts (
  receipt_number  VARCHAR(20) NOT NULL,                 -- format RC-2026-0001
  trade_id        INT UNSIGNED NOT NULL,                -- "produces"
  issue_date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount          DECIMAL(12,2) NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_receipts PRIMARY KEY (receipt_number),
  CONSTRAINT uq_receipts_trade_id UNIQUE (trade_id),    -- also indexes the foreign key
  CONSTRAINT chk_receipts_amount CHECK (amount > 0),
  CONSTRAINT fk_receipts_trade FOREIGN KEY (trade_id) REFERENCES trades (trade_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX idx_receipts_issue_date (issue_date)            -- revenue reports by period
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Receipt of each trade';


-- ---------------------------------------------------------------------
-- price_breakdowns: how a trade's final price was calculated (1 to 1;
-- recalculating updates the same row).
-- ---------------------------------------------------------------------
CREATE TABLE price_breakdowns (
  breakdown_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  trade_id            INT UNSIGNED NOT NULL,            -- "has"
  base_price          DECIMAL(12,2) NOT NULL DEFAULT 0,
  mileage_adjustment  DECIMAL(12,2) NOT NULL DEFAULT 0,
  damage_adjustment   DECIMAL(12,2) NOT NULL DEFAULT 0,
  charges             DECIMAL(12,2) NOT NULL DEFAULT 0,
  discounts           DECIMAL(12,2) NOT NULL DEFAULT 0,
  final_price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_price_breakdowns PRIMARY KEY (breakdown_id),
  CONSTRAINT uq_price_breakdowns_trade_id UNIQUE (trade_id), -- also indexes the foreign key
  CONSTRAINT chk_price_breakdowns_final_price CHECK (final_price > 0),
  CONSTRAINT fk_price_breakdowns_trade FOREIGN KEY (trade_id) REFERENCES trades (trade_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Price breakdown of each trade';


-- ---------------------------------------------------------------------
-- stock_movements is append-only. A CHECK or a foreign key cannot forbid
-- UPDATE/DELETE, so two triggers reject them. A single-statement body
-- needs no DELIMITER change, so "Execute All" works.
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_stock_movements_no_update
  BEFORE UPDATE ON stock_movements FOR EACH ROW
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Stock movements cannot be edited; record an opposite movement instead';

CREATE TRIGGER trg_stock_movements_no_delete
  BEFORE DELETE ON stock_movements FOR EACH ROW
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Stock movements cannot be deleted; record an opposite movement instead';
