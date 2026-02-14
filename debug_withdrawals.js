require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWithdrawal() {
    console.log("Fetching all withdraw transactions...");
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'withdraw');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.table(data.map(d => ({
        id: d.id.slice(0, 8),
        status: d.status,
        amount: d.amount,
        created_at: d.created_at
    })));
}

debugWithdrawal();
