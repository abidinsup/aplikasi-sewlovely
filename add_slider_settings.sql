-- Add slider settings to app_settings table
INSERT INTO app_settings (key, value)
VALUES 
  ('slider_badge', 'Info Mitra'),
  ('slider_title', 'Raih Bonusnya! Selesaikan 5 Pemasangan'),
  ('slider_description', 'Selesaikan 5 pemasangan minggu ini dan dapatkan bonus komisi tambahan'),
  ('slider_highlight', 'Rp 300.000')
ON CONFLICT (key) DO NOTHING;
