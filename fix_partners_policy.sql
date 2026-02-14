-- FIX PARTNERS RLS POLICY
-- Masalah: Error "new row violates row-level security policy for table 'partners'"
-- Solusi: Buka akses public untuk table partners agar user baru bisa register

-- 1. Enable RLS (pastikan aktif)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama jika ada (untuk menghindari konflik)
DROP POLICY IF EXISTS "Enable read access for all users" ON partners;
DROP POLICY IF EXISTS "Enable insert for all users" ON partners;
DROP POLICY IF EXISTS "Enable update for all users" ON partners;
DROP POLICY IF EXISTS "Enable delete for all users" ON partners;
DROP POLICY IF EXISTS "Public Access" ON partners;
DROP POLICY IF EXISTS "Public Select" ON partners;
DROP POLICY IF EXISTS "Public Insert" ON partners;

-- 3. Buat SATU policy "Public Access" yang mengizinkan SEMUA operasi (Select, Insert, Update, Delete)
-- INI PENTING karena pendaftaran user baru adalah INSERT tanpa auth session (anonim)
create policy "Public Access"
on partners
for all
using ( true )
with check ( true );

-- 4. Verifikasi (Optional comment)
COMMENT ON TABLE partners IS 'Partners table with Public Access Policy applied';
