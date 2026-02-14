require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
    const { data, error } = await supabase.from('transactions').select('*').limit(5);
    if (error) {
        console.error(error);
        return;
    }
    console.log("Full IDs found:");
    data.forEach(d => console.log(`${d.id} | ${d.status} | ${d.type}`));
}

checkIds();
