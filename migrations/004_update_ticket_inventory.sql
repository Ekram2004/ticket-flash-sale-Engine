BEGIN;

-- Add event ownership to existing ticket types.
ALTER TABLE tickets
ADD COLUMN event_id UUID;

-- Backfill event ownership using existing flash sales.
UPDATE tickets t
SET event_id = (
    SELECT fs.event_id
    FROM flash_sales_tickets fst
    JOIN flash_sales fs
        ON fs.id = fst.flash_sale_id
    WHERE fst.ticket_id = t.id
    LIMIT 1
);

ALTER TABLE tickets
ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE tickets
ADD CONSTRAINT tickets_event_id_fk
FOREIGN KEY (event_id) REFERENCES events(id);

-- Unique ticket type within an event.
ALTER TABLE tickets
ADD CONSTRAINT unique_ticket_type_per_event
UNIQUE (event_id, type);

ALTER TABLE tickets
ADD CONSTRAINT unique_event_ticket
UNIQUE (event_id, id);

-- Add a composite unique key to flash_sales.
ALTER TABLE flash_sales
ADD CONSTRAINT unique_event_flash_sale
UNIQUE (event_id, id);

-- Rename existing inventory columns.
ALTER TABLE flash_sales_tickets
RENAME COLUMN stock TO available_quantity;

ALTER TABLE flash_sales_tickets
RENAME COLUMN price TO price_minor;

-- Preserve the current stock as the initial total quantity.
ALTER TABLE flash_sales_tickets
ADD COLUMN total_quantity INTEGER;

UPDATE flash_sales_tickets
SET total_quantity = available_quantity;

ALTER TABLE flash_sales_tickets
ALTER COLUMN total_quantity SET NOT NULL;

ALTER TABLE flash_sales_tickets
ADD CONSTRAINT inventory_cannot_exceed_total
CHECK (available_quantity <= total_quantity);

-- Add event ownership to the sale-ticket relationship.
ALTER TABLE flash_sales_tickets
ADD COLUMN event_id UUID;

UPDATE flash_sales_tickets fst
SET event_id = fs.event_id
FROM flash_sales fs
WHERE fs.id = fst.flash_sale_id;

ALTER TABLE flash_sales_tickets
ALTER COLUMN event_id SET NOT NULL;

-- Enforce that the flash sale belongs to this event.
ALTER TABLE flash_sales_tickets
ADD CONSTRAINT sale_ticket_same_event
FOREIGN KEY (event_id, flash_sale_id)
REFERENCES flash_sales (event_id, id);

-- Enforce that the ticket type belongs to this event.
ALTER TABLE flash_sales_tickets
ADD CONSTRAINT sale_ticket_type_same_event
FOREIGN KEY (event_id, ticket_id)
REFERENCES tickets (event_id, id);

COMMIT;