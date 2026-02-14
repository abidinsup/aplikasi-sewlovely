
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLogin() {
    const email = 'pecintajahit91@gmail.com';
    const password = 'darderdor$91';

    console.log(`Attempting login for ${email} with password: ${password}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login Failed Detailed Error:', error);
    } else {
        console.log('Login Success!');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);

        // Check finding partner
        console.log('Checking for partner profile...');
        const { data: partner, error: partnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (partnerError) {
            console.log('Partner Profile Error (Expected for Admin):', partnerError);
        } else {
            console.log('Partner Profile Found (Unexpected for Admin):', partner);
        }
    }
}

debugLogin();
