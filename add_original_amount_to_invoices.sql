-- Menambahkan kolom original_amount ke tabel invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS original_amount NUMERIC;

-- Comment untuk deskripsi
COMMENT ON COLUMN invoices.original_amount IS 'Harga asli dari kalkulator sebelum negosiasi';
