
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminPartnerLink() {
    const adminEmail = 'pecintajahit91@gmail.com';
    console.log(`Checking for partners linked to ${adminEmail}...`);

    // 1. Check by Email
    const { data: partnerByEmail, error: emailError } = await supabase
        .from('partners')
        .select('*')
        .eq('email', adminEmail);

    if (emailError) {
        console.error('Error checking by email:', emailError);
    } else {
        console.log('Partners found by EMAIL:', partnerByEmail);
    }

    // 2. Check by Auth ID (need to login first to get ID, or just search all if possible)
    // Let's login again to get the ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: 'darderdor$91'
    });

    if (authError) {
        console.error('Auth Login Failed:', authError);
    } else {
        const userId = authData.user.id;
        console.log('Admin Auth ID:', userId);

        const { data: partnerById, error: idError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', userId);

        if (idError) {
            console.error('Error checking by ID:', idError);
        } else {
            console.log('Partners found by Auth ID:', partnerById);
        }
    }
}

checkAdminPartnerLink();
