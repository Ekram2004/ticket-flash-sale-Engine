ALTER TABLE order_items
ADD CONSTRAINT order_items_quantity_must_be_one
CHECK (quantity = 1);