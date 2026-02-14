
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: Usually we need SERVICE_ROLE_KEY to create users without confirmation, 
// but signUp with anon key works if email confirmation is disabled or if we just want to trigger it.
// If email confirmation is ON, the user will need to check email. 
// Let's try standard signUp.

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
    const email = 'pecintajahit91@gmail.com';
    const password = 'darderdor$91';

    console.log(`Creating user ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Owner Sewlovely',
            }
        }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created successfully!');
        console.log('User ID:', data.user?.id);
        console.log('Session:', data.session ? 'Active' : 'Pending Verification');

        if (!data.session && data.user) {
            console.log('NOTE: Jika "Session" Pending, Anda mungkin perlu memverifikasi email atau menonaktifkan "Confirm Email" di Supabase Dashboard bagian Authentication -> Providers -> Email.');
        }
    }
}

createAdminUser();
