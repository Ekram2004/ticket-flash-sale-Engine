-- Add reservation expiration.
ALTER TABLE orders
ADD COLUMN expires_at TIMESTAMPTZ;

-- Give existing orders a 10-minute expiration window.
UPDATE orders
SET expires_at = created_at + INTERVAL '10 minutes';

ALTER TABLE orders
ALTER COLUMN expires_at SET NOT NULL;

ALTER TABLE orders
ADD CONSTRAINT valid_order_expiration
CHECK (expires_at > created_at);

-- Replace permanent one-order-per-sale uniqueness.
ALTER TABLE orders
DROP CONSTRAINT unique_user_per_sale;

-- Prevent multiple pending or confirmed orders for one user and sale.
CREATE UNIQUE INDEX unique_active_order_per_user_sale
ON orders (user_id, flash_sale_id)
WHERE status IN ('PENDING', 'CONFIRMED');

-- Support expiration processing and user order history.
CREATE INDEX idx_orders_pending_expiration
ON orders (expires_at)
WHERE status = 'PENDING';

CREATE INDEX idx_orders_user_created
ON orders (user_id, created_at DESC);

