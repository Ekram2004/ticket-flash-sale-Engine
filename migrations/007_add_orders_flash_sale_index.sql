-- Remove redundant index: the composite unique index
-- (event_id, id) already supports event_id lookups.
DROP INDEX IF EXISTS idx_flash_sales_event_id;

-- Support finding orders belonging to a flash sale.
CREATE INDEX IF NOT EXISTS idx_orders_flash_sale_id
ON orders (flash_sale_id);