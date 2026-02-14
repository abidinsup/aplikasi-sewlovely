-- SQL Script to fix Transaction Status Constraint
-- This allows the 'rejected' status for commission withdrawals

-- 1. Identify the constraint name (usually 'transactions_status_check')
-- 2. Drop the existing constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_status_check;

-- 3. Re-add the constraint with 'rejected' included
ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'success', 'rejected'));

-- 4. Verify
COMMENT ON CONSTRAINT transactions_status_check ON transactions IS 'Allow pending, success, and rejected statuses';
