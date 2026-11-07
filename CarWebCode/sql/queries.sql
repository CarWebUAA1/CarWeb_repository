-- =====================================================================
-- CarWeb: example queries. Run after schema.sql and seed.sql.
-- =====================================================================

USE carweb;

-- For each trade, the customer's name, phone and email, taken from the
-- appointment where the trade started (customers have no account).
SELECT
  t.trade_id,
  t.trade_type,
  t.status,
  t.price,
  a.client_name,
  a.client_phone,
  a.client_email,
  CONCAT(c.brand, ' ', c.model, ' ', c.year) AS car,
  e.name AS employee,
  m.name AS approved_by
FROM trades t
JOIN appointments a   ON a.appointment_id = t.appointment_id
LEFT JOIN cars c      ON c.car_id = t.car_id
JOIN staff e          ON e.staff_id = t.employee_id
LEFT JOIN staff m     ON m.staff_id = t.manager_id
ORDER BY t.trade_date;
