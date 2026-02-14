-- FIX TRANSACTIONS RLS POLICY
-- Masalah: Perubahan status penarikan (withdrawal) tidak tersimpan ke database
-- Solusi: Berikan akses public untuk operasi Update pada table transactions

-- 1. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update for all users" ON transactions;
DROP POLICY IF EXISTS "Enable delete for all users" ON transactions;

-- 3. Create a single PERMISSIVE policy for ALL operations
CREATE POLICY "Public Access"
ON transactions
FOR ALL
USING ( true )
WITH CHECK ( true );

-- 4. Verify
COMMENT ON TABLE transactions IS 'Transactions table with Public Access Policy applied (Fixed for Withdrawal Approval)';
