
-- =========================================
-- 1. USERS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,

    account_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('active', 'suspended', 'disabled')),

    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================
-- 2. EVENTS
-- =========================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT
);


-- =========================================
-- 3. TICKETS
-- =========================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,

    event_id UUID NOT NULL REFERENCES events(id),

    type VARCHAR(100) NOT NULL DEFAULT 'regular'
        CHECK (type IN ('regular', 'VIP', 'VVIP')),

    CONSTRAINT unique_event_ticket UNIQUE (event_id, id),

    CONSTRAINT unique_ticket_type_per_event UNIQUE (event_id, type)
);


-- =========================================
-- 4. FLASH SALES
-- =========================================

CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID PRIMARY KEY,

    event_id UUID NOT NULL REFERENCES events(id),

    title VARCHAR(100) NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    max_item_per_person INT NOT NULL DEFAULT 1
        CHECK (max_item_per_person > 0),

    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'active', 'ended')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (start_time < end_time),

    CONSTRAINT unique_event_flash_sale UNIQUE (event_id, id)
);


-- =========================================
-- 5. FLASH SALE TICKET INVENTORY
-- =========================================

CREATE TABLE IF NOT EXISTS flash_sales_tickets (
    event_id UUID NOT NULL,
    flash_sale_id UUID NOT NULL,
    ticket_id UUID NOT NULL,

    price_minor BIGINT NOT NULL
        CHECK (price_minor > 0),

    total_quantity INT NOT NULL,

    available_quantity INT NOT NULL
        CHECK (
            available_quantity >= 0
            AND available_quantity <= total_quantity
        ),

    PRIMARY KEY (flash_sale_id, ticket_id),

    FOREIGN KEY (event_id, flash_sale_id)
        REFERENCES flash_sales(event_id, id),

    FOREIGN KEY (event_id, ticket_id)
        REFERENCES tickets(event_id, id)
);


-- =========================================
-- 6. ORDERS
-- =========================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id),

    flash_sale_id UUID NOT NULL REFERENCES flash_sales(id),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT valid_order_expiration
        CHECK (expires_at > created_at)
);


-- One active booking per customer per flash sale.
-- Expired and cancelled orders do not block a new booking.

CREATE UNIQUE INDEX unique_active_order_per_user_sale
ON orders (user_id, flash_sale_id)
WHERE status IN ('PENDING', 'CONFIRMED');


-- =========================================
-- 7. ORDER ITEMS
-- =========================================

CREATE TABLE IF NOT EXISTS order_items (
    order_id UUID NOT NULL REFERENCES orders(id),

    flash_sale_id UUID NOT NULL,
    ticket_id UUID NOT NULL,

    quantity INT NOT NULL
        CHECK (quantity > 0 AND quantity = 1),

    unit_price BIGINT NOT NULL
        CHECK (unit_price > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (order_id, flash_sale_id, ticket_id),

    FOREIGN KEY (flash_sale_id, ticket_id)
        REFERENCES flash_sales_tickets(flash_sale_id, ticket_id)
);


-- =========================================
-- 8. INDEXES
-- =========================================

CREATE INDEX idx_flash_sales_event_id
ON flash_sales(event_id);

CREATE INDEX idx_order_items_sales_ticket
ON order_items(flash_sale_id, ticket_id);

CREATE INDEX idx_orders_pending_expiration
ON orders(expires_at)
WHERE status = 'PENDING';

CREATE INDEX idx_orders_user_created
ON orders(user_id, created_at DESC);

CREATE INDEX idx_orders_flash_sale_id
ON orders(flash_sale_id);
