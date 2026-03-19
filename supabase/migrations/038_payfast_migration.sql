-- Rename paystack columns to generic payment columns
ALTER TABLE blindly_orders RENAME COLUMN paystack_reference TO payment_reference;
ALTER TABLE blindly_orders DROP COLUMN IF EXISTS paystack_access_code;
