
-- FIX PARTNERS STATUS CONSTRAINT
-- Masalah: Pendaftaran gagal karena status 'Pending' tidak diizinkan oleh constraint database.
-- Solusi: Update constraint agar mengizinkan 'Pending', 'Active', dan 'Inactive'.

DO $$
BEGIN
    -- 1. Hapus constraint lama jika ada
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_status_check') THEN
        ALTER TABLE "public"."partners" DROP CONSTRAINT "partners_status_check";
    END IF;
END $$;

-- 2. Tambahkan constraint baru yang mengizinkan 'Pending'
ALTER TABLE "public"."partners" 
ADD CONSTRAINT "partners_status_check" 
CHECK (status IN ('Pending', 'Active', 'Inactive', 'pending', 'active', 'inactive'));

-- 3. Verifikasi RLS (Opsional: pastikan pendaftaran anonim bisa insert)
-- Jika user minta 'hapus keamanan', pastikan policy insert aktif untuk semua
DROP POLICY IF EXISTS "Enable insert for all users" ON partners;
CREATE POLICY "Enable insert for all users" ON partners FOR INSERT WITH CHECK (true);
