
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: We normally need SERVICE_ROLE_KEY to check Auth users list or update them.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function checkPartnerStatus() {
    const email = 'abidin1190@gmail.com';
    console.log(`Checking status for: ${email}`);

    // 1. Check Table
    const { data: partner, error: tableError } = await supabase
        .from('partners')
        .select('*')
        .eq('email', email)
        .single();

    if (tableError) {
        console.error('Table Error:', tableError);
    } else {
        console.log('Partner in Table:', {
            id: partner.id,
            email: partner.email,
            status: partner.status,
            stored_password_text: partner.password // Check what is here
        });
    }

    // 2. Check Auth (Only if we have Service Key)
    if (supabaseServiceKey) {
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Auth Error:', authError);
        } else {
            const user = users.find(u => u.email === email);
            if (user) {
                console.log('User in Auth:', {
                    id: user.id,
                    email: user.email,
                    confirmed_at: user.confirmed_at,
                    last_sign_in_at: user.last_sign_in_at
                });
            } else {
                console.log('User NOT found in Auth!');
            }
        }
    } else {
        console.log('Skipping Auth check: No SUPABASE_SERVICE_ROLE_KEY in .env.local');
        console.log('To fix this, please ensure you have SUPABASE_SERVICE_ROLE_KEY in .env.local and run the fix script.');
    }
}

checkPartnerStatus();
