-- Drop the existing check constraint to allow new categories
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Optional: Re-add the constraint with new allowed values if you want to maintain strictness
-- ALTER TABLE products ADD CONSTRAINT products_category_check 
-- CHECK (category IN ('Gorden', 'Impor', 'Lokal', 'Aksesoris', 'Wallpaper', 'Blind', 'Sprei', 'Bedcover', 'Kantor', 'Hospital')); 
-- (Adjust the list above based on your actual categories)

-- Insert Sprei Products
INSERT INTO products (name, category, price, unit) VALUES
('Sprei Single Small (90x200)', 'Sprei', 150000, 'pcs'),
('Sprei Single (100x200)', 'Sprei', 160000, 'pcs'),
('Sprei Double (120x200)', 'Sprei', 170000, 'pcs'),
('Sprei Queen (160x200)', 'Sprei', 200000, 'pcs'),
('Sprei King (180x200)', 'Sprei', 220000, 'pcs'),
('Sprei Extra King (200x200)', 'Sprei', 240000, 'pcs');

-- Insert Bedcover Products
INSERT INTO products (name, category, price, unit) VALUES
('Bedcover Super Single (150x230)', 'Bedcover', 350000, 'pcs'),
('Bedcover Queen (200x200)', 'Bedcover', 450000, 'pcs'),
('Bedcover King (220x230)', 'Bedcover', 500000, 'pcs'),
('Bedcover Super King (250x230)', 'Bedcover', 550000, 'pcs');
