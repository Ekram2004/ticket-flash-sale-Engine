CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ( 'active','suspended', 'disabled')),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events(
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tickets(
    id UUID PRIMARY KEY,
    type VARCHAR(100) NOT NULL DEFAULT 'regular' CHECK(type IN ('regular', 'VIP', 'VVIP'))
);

CREATE TABLE IF NOT EXISTS flash_sales(
    id UUID PRIMARY KEY,
    event_id UUID  NOT NULL REFERENCES events(id),
    title VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_item_per_person INT NOT NULL DEFAULT 1 CHECK(max_item_per_person > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK(start_time < end_time)
);

CREATE TABLE IF NOT EXISTS flash_sales_tickets(
    flash_sale_id UUID NOT NULL REFERENCES flash_sales(id),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    price BIGINT NOT NULL CHECK(price > 0),
    stock INT NOT NULL CHECK(stock >= 0),
    
    PRIMARY KEY (flash_sale_id, ticket_id)
);

CREATE TABLE IF NOT EXISTS orders(
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    flash_sale_id UUID NOT NULL REFERENCES flash_sales(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED','EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_per_sale UNIQUE (user_id, flash_sale_id)
);

CREATE TABLE IF NOT EXISTS order_items(
    order_id UUID NOT NULL REFERENCES orders(id),
    flash_sale_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL CHECK (unit_price > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (order_id, flash_sale_id, ticket_id),
    FOREIGN KEY (flash_sale_id, ticket_id) REFERENCES flash_sales_tickets(flash_sale_id, ticket_id)
);

CREATE INDEX idx_flash_sales_event_id ON flash_sales(event_id);
CREATE INDEX idx_order_items_sales_ticket ON order_items(flash_sale_id, ticket_id);