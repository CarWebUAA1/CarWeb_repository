-- =====================================================================
-- CarWeb: rule checks. Run AFTER schema.sql and seed.sql.
--
-- Workbench stops the script at the first error, so run each block on its
-- own: put the cursor on the statement and press Ctrl + Enter.
-- Every statement marked "MUST FAIL" is expected to fail with the error shown.
-- Statements marked "setup" or "cleanup" must succeed.
-- (The database name in the messages is `carweb`.)
-- =====================================================================

USE carweb;
SET SQL_SAFE_UPDATES = 0;


-- ---------------------------------------------------------------------
-- 1. Duplicate VIN
-- MUST FAIL -> Error 1062: Duplicate entry '3TMCZ5AN1LM000001' for key 'cars.uq_cars_vin'
-- ---------------------------------------------------------------------
INSERT INTO cars (vin, brand, model, year, fuel_type, transmission, color)
VALUES ('3TMCZ5AN1LM000001', 'Toyota', 'Corolla', 2021, 'Gasoline', 'Automatic', 'Black');


-- ---------------------------------------------------------------------
-- 2. A second active trade for the same car
-- setup (succeeds): first active trade for car 3, from Carlos's pending appointment 5
INSERT INTO trades (appointment_id, employee_id, car_id, trade_type, estimated_price)
VALUES (5, 2, 3, 'Purchase', 355000.00);

-- MUST FAIL -> Error 1062: Duplicate entry '3' for key 'trades.uq_trades_active_car_id'
INSERT INTO trades (appointment_id, employee_id, car_id, trade_type, estimated_price)
VALUES (5, 3, 3, 'Purchase', 350000.00);

-- cleanup (succeeds): remove the setup trade
DELETE FROM trades WHERE appointment_id = 5 AND car_id = 3;
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- 3. A stock movement with a car AND a spare part
-- MUST FAIL -> Error 3819: Check constraint 'chk_stock_movements_one_item' is violated.
-- ---------------------------------------------------------------------
INSERT INTO stock_movements (car_id, spare_part_id, manager_id, movement_type, reason)
VALUES (1, 1, 1, 'In', 'Transfer');


-- ---------------------------------------------------------------------
-- 4. Two appointments with the same email at the same time
-- MUST FAIL -> Error 1062: Duplicate entry 'laura.rios@example.com-2026-10-05 10:00:00'
--              for key 'appointments.uq_appointments_client_email_datetime'
-- ---------------------------------------------------------------------
INSERT INTO appointments (client_name, client_phone, client_email, manage_token_hash,
                          appointment_type, appointment_datetime)
VALUES ('Laura Rios', '4492001001', 'laura.rios@example.com', SHA2('check-token-4', 256),
        'Viewing', '2026-10-05 10:00:00');


-- ---------------------------------------------------------------------
-- 5. A second test drive for the same appointment
-- MUST FAIL -> Error 1062: Duplicate entry '3' for key 'test_drives.uq_test_drives_appointment_id'
-- ---------------------------------------------------------------------
INSERT INTO test_drives (appointment_id, employee_id, car_id, schedule_start, schedule_end)
VALUES (3, 2, 2, '2026-10-13 10:00:00', '2026-10-13 10:45:00');


-- ---------------------------------------------------------------------
-- 6. A negative price
-- MUST FAIL -> Error 3819: Check constraint 'chk_cars_sale_price' is violated.
-- ---------------------------------------------------------------------
UPDATE cars SET sale_price = -1000.00 WHERE car_id = 1;


-- ---------------------------------------------------------------------
-- 7. Deleting an appointment that has trades
-- MUST FAIL -> Error 1451: Cannot delete or update a parent row: a foreign key constraint fails
--              (`carweb`.`trades`, CONSTRAINT `fk_trades_appointment` FOREIGN KEY (`appointment_id`)
--              REFERENCES `appointments` (`appointment_id`) ON DELETE RESTRICT ON UPDATE RESTRICT)
-- ---------------------------------------------------------------------
DELETE FROM appointments WHERE appointment_id = 2;


-- =====================================================================
-- Extra checks (other rules of the specification)
-- =====================================================================

-- 8. A spare part trade can only be a Purchase
-- MUST FAIL -> Error 3819: Check constraint 'chk_trades_spare_part_purchase' is violated.
INSERT INTO trades (appointment_id, employee_id, spare_part_id, trade_type)
VALUES (5, 2, 1, 'Sale');

-- 9. Car year out of range
-- MUST FAIL -> Error 3819: Check constraint 'chk_cars_year' is violated.
INSERT INTO cars (vin, brand, model, year, fuel_type, transmission, color)
VALUES ('1HGCM82633A000099', 'Honda', 'Accord', 1985, 'Gasoline', 'Manual', 'White');

-- 10. Test drive that ends before it starts
-- MUST FAIL -> Error 3819: Check constraint 'chk_test_drives_schedule' is violated.
INSERT INTO test_drives (appointment_id, employee_id, car_id, schedule_start, schedule_end)
VALUES (5, 2, 3, '2026-11-20 13:00:00', '2026-11-20 12:00:00');

-- 11. Stock movements cannot be edited or deleted (triggers)
-- MUST FAIL -> Error 1644: Stock movements cannot be edited; record an opposite movement instead
UPDATE stock_movements SET reason = 'Return' WHERE movement_id = 1;
-- MUST FAIL -> Error 1644: Stock movements cannot be deleted; record an opposite movement instead
DELETE FROM stock_movements WHERE movement_id = 1;

-- 12. A trade with a contract (or receipt, or price breakdown) cannot be deleted.
-- (Only its documents would be deleted with it: fk_documents_trade is the only CASCADE.)
-- MUST FAIL -> Error 1451: Cannot delete or update a parent row: a foreign key constraint fails
--              (`carweb`.`contracts`, CONSTRAINT `fk_contracts_trade` FOREIGN KEY (`trade_id`)
--              REFERENCES `trades` (`trade_id`) ON DELETE RESTRICT ON UPDATE RESTRICT)
DELETE FROM trades WHERE trade_id = 1;


-- =====================================================================
-- Staff rules (single `staff` table; staff 1 = Manager, 2 and 3 = Employees)
-- =====================================================================

-- 13. Only a manager can approve or reject a trade
-- MUST FAIL -> Error 1452: Cannot add or update a child row: a foreign key constraint fails
--              (`carweb`.`trades`, CONSTRAINT `fk_trades_manager` FOREIGN KEY (`manager_id`, `manager_role`)
--              REFERENCES `staff` (`staff_id`, `role`) ON DELETE RESTRICT ON UPDATE RESTRICT)
UPDATE trades SET manager_id = 2 WHERE trade_id = 1;

-- 14. Only a manager can record a stock movement
-- MUST FAIL -> Error 1452: ... CONSTRAINT `fk_stock_movements_manager` ...
INSERT INTO stock_movements (car_id, manager_id, movement_type, reason)
VALUES (1, 3, 'In', 'Transfer');

-- 15. The same email cannot belong to two staff members
-- MUST FAIL -> Error 1062: Duplicate entry 'ana.torres@carweb.test' for key 'staff.uq_staff_email'
INSERT INTO staff (name, phone, email, password_hash, role)
VALUES ('Ana Torres', '4491000009', 'ana.torres@carweb.test', '$2b$12$notarealhashnotarealhashnotarealhashnotarealhashnotare', 'Manager');

-- 16. A manager can also do employee tasks: accompany a test drive
-- succeeds (manager 1 accompanies a test drive)
INSERT INTO test_drives (appointment_id, employee_id, car_id, schedule_start, schedule_end)
VALUES (5, 1, 3, '2026-11-20 12:00:00', '2026-11-20 12:45:00');
-- cleanup (succeeds)
DELETE FROM test_drives WHERE appointment_id = 5;

