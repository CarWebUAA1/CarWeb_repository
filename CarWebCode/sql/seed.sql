-- =====================================================================
-- CarWeb: test data. Run after schema.sql ("Execute All").
--
-- Staff password hashes are bcrypt (cost 12) of the development password
-- "DevPassword123!". Never use these accounts or this password in production.
--
-- Story told by the data:
--   * Laura (2 appointments): viewed car 1, then bought car 5      -> trade 1 (Purchase)
--   * Carlos (2 appointments): test drove car 2, will view car 3   -> test drive 1
--   * Sofia (1 appointment): sold her Jetta (car 7) to the agency   -> trade 2 (Sale)
--   * Car 8 is used for spare parts.
-- =====================================================================

USE carweb;

-- ---------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------
INSERT INTO managers (manager_id, name, phone, email, password_hash) VALUES
(1, 'Maria Lopez', '4491000001', 'maria.lopez@carweb.test',
 '$2b$12$jc5u0B53sRZL92wib3OY0OrVgJ.tvzycyocZgHJlRFiK4IwcwLiLe');

INSERT INTO employees (employee_id, name, phone, email, password_hash) VALUES
(1, 'Ana Torres',  '4491000002', 'ana.torres@carweb.test',
 '$2b$12$uvSGutGx4TYF/704Hk6cE.1D75ccHdnaLGnH8sF5fPaOUDRUSxKVK'),
(2, 'Luis Medina', '4491000003', 'luis.medina@carweb.test',
 '$2b$12$oeqw6nNdlnJzzvsRhy1PdOsosgJB8ZS6MH5wyBHR.U2eNlhhHF7sW');

-- ---------------------------------------------------------------------
-- Cars: 8 cars in different states
-- ---------------------------------------------------------------------
INSERT INTO cars (car_id, vin, plates, brand, model, year, version, series, mileage, fuel_type, transmission,
                  color, status, tire_condition, service_history, purchase_price, base_price, sale_price,
                  test_drive_authorized, photos, inventory_status) VALUES
(1, '3TMCZ5AN1LM000001', 'AGS-101-A', 'Toyota', 'Corolla', 2020, 'LE', 'E210', 45200, 'Gasoline', 'Automatic',
 'White', 'Available', 'Good', 'Oil change every 10,000 km at an official dealer.', 210000.00, 245000.00, 255000.00,
 TRUE, '["https://example.com/corolla-1.jpg", "https://example.com/corolla-2.jpg"]', 'In stock'),
(2, '2HGFC2F59KH000002', 'AGS-102-B', 'Honda', 'Civic', 2019, 'EX', 'FC', 61000, 'Gasoline', 'Automatic',
 'Black', 'Available', 'Good', NULL, 230000.00, 260000.00, 268000.00,
 TRUE, '["https://example.com/civic-1.jpg"]', 'In stock'),
(3, 'JM3KFBCM1M0000003', 'AGS-103-C', 'Mazda', 'CX-5', 2021, 'i Sport', 'KF', 38800, 'Gasoline', 'Automatic',
 'Soul Red', 'Available', 'Good', 'Major service at 30,000 km.', 300000.00, 340000.00, 355000.00,
 TRUE, '["https://example.com/cx5-1.jpg", "https://example.com/cx5-2.jpg"]', 'In stock'),
(4, '3N1CN8DV7NL000004', 'AGS-104-D', 'Nissan', 'Versa', 2022, 'Advance', 'N18', 18900, 'Gasoline', 'Manual',
 'Red', 'Reserved', 'Good', NULL, 215000.00, 240000.00, 249000.00,
 TRUE, '["https://example.com/versa-1.jpg"]', 'In stock'),
(5, '3G1TA5AF8JL000005', 'AGS-105-E', 'Chevrolet', 'Aveo', 2018, 'LT', 'T300', 80200, 'Gasoline', 'Manual',
 'Blue', 'Sold', 'Fair', NULL, 120000.00, 150000.00, 150000.00,
 TRUE, '["https://example.com/aveo-1.jpg"]', 'Out of stock'),
(6, '1FMCU0GD4LU000006', 'AGS-106-F', 'Ford', 'Escape', 2020, 'SE', 'CX482', 29800, 'Hybrid', 'Automatic',
 'Gray', 'In test drive', 'Good', NULL, 400000.00, 445000.00, 455000.00,
 TRUE, '["https://example.com/escape-1.jpg"]', 'In stock'),
(7, '3VWDB7AJ9HM000007', 'AGS-107-G', 'Volkswagen', 'Jetta', 2017, 'Comfortline', 'A6', 98500, 'Gasoline', 'Automatic',
 'Silver', 'Pending evaluation', 'Poor', 'Unknown service history.', 180000.00, NULL, NULL,
 FALSE, NULL, 'In stock'),
(8, 'KL1CD6S54CC000008', NULL, 'Chevrolet', 'Spark', 2012, 'LT', 'M300', 160000, 'Gasoline', 'Manual',
 'Green', 'Spare parts', 'Poor', NULL, 30000.00, NULL, NULL,
 FALSE, NULL, 'In stock');

-- ---------------------------------------------------------------------
-- Spare parts: two taken from car 8, one bought separately (no car)
-- ---------------------------------------------------------------------
INSERT INTO spare_parts (part_id, car_id, brand, model, status, price, inventory_status) VALUES
(1, 8,    'Chevrolet', 'Spark', 'Available', 3500.00, 'In stock'),   -- alternator
(2, 8,    'Chevrolet', 'Spark', 'Available', 1800.00, 'In stock'),   -- left headlight
(3, NULL, 'Nissan',    'Versa', 'Available', 2200.00, 'In stock');   -- brake pads

-- ---------------------------------------------------------------------
-- Stock movements (append-only)
-- ---------------------------------------------------------------------
INSERT INTO stock_movements (movement_id, car_id, spare_part_id, manager_id, movement_type, reason, movement_date) VALUES
(1, 5,    NULL, 1, 'Out', 'Sale',        '2026-10-10 13:00:00'),  -- car 5 sold to Laura (trade 1)
(2, 7,    NULL, 1, 'In',  'Purchase',    '2026-10-15 12:30:00'),  -- car 7 bought from Sofia (trade 2)
(3, NULL, 1,    1, 'In',  'Spare parts', '2026-10-20 09:00:00');  -- alternator taken from car 8

-- ---------------------------------------------------------------------
-- Appointments: 5 appointments of 3 customers.
-- manage_token_hash = SHA-256 (64 hex chars) of the token in the customer's link.
-- ---------------------------------------------------------------------
INSERT INTO appointments (appointment_id, client_name, client_phone, client_email, manage_token_hash,
                          employee_id, car_id, decision_by, appointment_type, appointment_datetime, status, cancel_reason) VALUES
(1, 'Laura Rios',   '4492001001', 'laura.rios@example.com',   SHA2('seed-token-appointment-1', 256),
 1, 1, 1, 'Viewing',         '2026-10-05 10:00:00', 'Completed', NULL),
(2, 'Laura Rios',   '4492001001', 'laura.rios@example.com',   SHA2('seed-token-appointment-2', 256),
 1, 5, 1, 'Purchase',        '2026-10-08 11:00:00', 'Completed', NULL),
(3, 'Carlos Vega',  '4492002002', 'carlos.vega@example.com',  SHA2('seed-token-appointment-3', 256),
 2, 2, 2, 'Test drive',      '2026-10-12 16:00:00', 'Completed', NULL),
(4, 'Sofia Mendez', '4492003003', 'sofia.mendez@example.com', SHA2('seed-token-appointment-4', 256),
 2, NULL, 2, 'Sale evaluation', '2026-10-14 09:30:00', 'Completed', NULL),  -- her car was not registered yet
(5, 'Carlos Vega',  '4492002002', 'carlos.vega@example.com',  SHA2('seed-token-appointment-5', 256),
 NULL, 3, NULL, 'Viewing',   '2026-11-20 12:00:00', 'Pending', NULL);

-- ---------------------------------------------------------------------
-- Test drive (from appointment 3)
-- ---------------------------------------------------------------------
INSERT INTO test_drives (test_drive_id, appointment_id, employee_id, car_id, schedule_start, schedule_end,
                         start_time, end_time, observations) VALUES
(1, 3, 2, 2, '2026-10-12 16:00:00', '2026-10-12 16:45:00',
 '2026-10-12 16:05:00', '2026-10-12 16:40:00', 'Smooth drive. Customer asked about the timing belt.');

-- ---------------------------------------------------------------------
-- Inspections
-- ---------------------------------------------------------------------
INSERT INTO inspections (inspection_id, car_id, inspection_date, mechanical_condition, exterior_condition,
                         interior_condition, faults, damage, observations, photos, result) VALUES
(1, 7, '2026-10-14 10:00:00', 'Fair', 'Fair', 'Good',
 'Worn brake pads; check engine light on.', 'Scratch on the rear bumper.', 'Bought from a customer.',
 '["https://example.com/inspection-jetta-1.jpg", "https://example.com/inspection-jetta-2.jpg"]', 'Needs repair'),
(2, 8, '2026-10-19 11:00:00', 'Poor', 'Poor', 'Fair',
 'Engine failure.', 'Front-end collision.', 'Not road-worthy; parts can be reused.',
 '["https://example.com/inspection-spark-1.jpg"]', 'Spare parts only');

-- ---------------------------------------------------------------------
-- Trades: 2 completed operations (inactive, so the cars are free for new trades).
-- ---------------------------------------------------------------------
INSERT INTO trades (trade_id, appointment_id, employee_id, manager_id, car_id, spare_part_id, trade_type, status,
                    price, estimated_price, listing_price, trade_date, last_price_edit, reserved_until, is_active) VALUES
-- Laura buys car 5 from the agency.
(1, 2, 1, 1, 5, NULL, 'Purchase', 'Completed', 145000.00, 150000.00, 150000.00,
 '2026-10-08 11:30:00', '2026-10-09 10:00:00', NULL, FALSE),
-- Sofia sells car 7 to the agency.
(2, 4, 2, 1, 7, NULL, 'Sale',     'Completed', 180000.00, 185000.00, NULL,
 '2026-10-14 10:30:00', NULL, NULL, FALSE);

-- Documents
INSERT INTO documents (trade_id, document_type, status, received_date, file_path) VALUES
(1, 'Official ID',       'Received', '2026-10-08 11:40:00', 'documents/trade-1/official-id.pdf'),
(1, 'Proof of address',  'Received', '2026-10-08 11:40:00', 'documents/trade-1/proof-of-address.pdf'),
(2, 'Official ID',       'Received', '2026-10-14 10:40:00', 'documents/trade-2/official-id.pdf'),
(2, 'Proof of address',  'Received', '2026-10-14 10:40:00', 'documents/trade-2/proof-of-address.pdf'),
(2, 'Invoice or title',  'Received', '2026-10-14 10:45:00', 'documents/trade-2/invoice.pdf'),
(2, 'Registration card', 'Received', '2026-10-14 10:45:00', 'documents/trade-2/registration-card.pdf'),
(2, 'No-debt proof',     'Received', '2026-10-14 10:50:00', 'documents/trade-2/no-debt-proof.pdf');

-- Contracts
INSERT INTO contracts (contract_number, trade_id, generated_at, pdf_path) VALUES
('CT-2026-0001', 1, '2026-10-10 12:00:00', 'contracts/CT-2026-0001.pdf'),
('CT-2026-0002', 2, '2026-10-15 12:00:00', 'contracts/CT-2026-0002.pdf');

-- Receipts (amount = final trade price)
INSERT INTO receipts (receipt_number, trade_id, issue_date, amount) VALUES
('RC-2026-0001', 1, '2026-10-10 13:00:00', 145000.00),
('RC-2026-0002', 2, '2026-10-15 12:30:00', 180000.00);

-- Price breakdowns.
-- Convention: final_price = base_price + mileage_adjustment + damage_adjustment + charges - discounts
-- (adjustments are negative when they lower the price).
INSERT INTO price_breakdowns (trade_id, base_price, mileage_adjustment, damage_adjustment, charges, discounts, final_price) VALUES
(1, 150000.00, -3000.00, -2000.00, 1500.00, 1500.00, 145000.00),  -- 150000 - 3000 - 2000 + 1500 - 1500
(2, 195000.00, -8000.00, -5000.00,    0.00, 2000.00, 180000.00);  -- 195000 - 8000 - 5000 + 0 - 2000
