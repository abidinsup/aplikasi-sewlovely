
-- 1. Enable RLS (just to be safe, so policies apply)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;
DROP POLICY IF EXISTS "Public Access" ON products;

-- 3. Create a single PERMISSIVE policy for ALL operations
-- This allows anyone with the API Key (Anon/Service) to Select, Insert, Update, Delete
create policy "Public Access"
on products
for all
using ( true )
with check ( true );

-- 4. Verify it's verified
COMMENT ON TABLE products IS 'Publicly writable products table (Fix applied)';
