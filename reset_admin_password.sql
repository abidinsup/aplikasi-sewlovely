
-- Update password untuk user admin
-- Ganti 'darderdor$91' dengan password yang Anda inginkan jika perlu
UPDATE auth.users
SET encrypted_password = crypt('darderdor$91', gen_salt('bf'))
WHERE email = 'pecintajahit91@gmail.com';

-- Konfirmasi perubahan
SELECT email, encrypted_password FROM auth.users WHERE email = 'pecintajahit91@gmail.com';
