-- Expire historical experimental reservations.
UPDATE orders
SET status = 'EXPIRED'
WHERE status = 'PENDING';

-- Restore ticket inventory for the next experiment.
UPDATE flash_sales_tickets
SET available_quantity = total_quantity;