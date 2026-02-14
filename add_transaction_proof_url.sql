-- Add proof_url column to transactions table for withdrawal transfer receipts
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Note: You may also need to ensure the 'success' and 'rejected' statuses are allowed 
-- if you haven't run the previous update_transactions_status.sql script.
