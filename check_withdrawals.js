const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWithdrawals() {
    console.log('Checking withdrawal transactions...');
    const { data, error } = await supabase
        .from('transactions')
        .select('id, type, status, amount, created_at')
        .eq('type', 'withdraw');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Results:');
    console.table(data);
}

checkWithdrawals();
