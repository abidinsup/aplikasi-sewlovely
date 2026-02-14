
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using anon key might fail if RLS prevents deletion. 
// Ideally we need service_role key, but I don't have it in env variables easily accessible here if only local env is used.
// However, I can try to use the admin USER session I just created to delete it, assuming Admin has delete rights.
// BUT, the admin is not logged in yet in this script context.

// Let's try to just delete it with anon key. If RLS is set to "public can do anything" (which it seemed to be for some tables), it might work.
// If not, I will guide the user to delete it manually or use SQL.

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteIncorrectPartner() {
    const emailToDelete = 'pecintajahit91@gmail.com';
    console.log(`Attempting to delete partner with email: ${emailToDelete}`);

    const { data, error } = await supabase
        .from('partners')
        .delete()
        .eq('email', emailToDelete);

    if (error) {
        console.error('Delete Failed:', error);
        console.log('NOTE: Since delete failed (likely due to RLS), please run the SQL script I will provide next.');
    } else {
        console.log('Delete command executed. Response:', data);
        console.log('Verifying if record is gone...');

        const { data: check, error: checkError } = await supabase
            .from('partners')
            .select('*')
            .eq('email', emailToDelete);

        if (check && check.length > 0) {
            console.log('Record STILL EXISTS (RLS prevented deletion).');
        } else {
            console.log('Record successfully deleted!');
        }
    }
}

deleteIncorrectPartner();
