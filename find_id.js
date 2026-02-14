require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findFullId() {
    const { data: fetchResult, error } = await supabase
        .from('transactions')
        .select('id')
        .filter('id', 'ilike', 'f91bafdc%');

    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Full IDs starting with f91bafdc:");
    fetchResult.forEach(f => console.log(f.id));
}

findFullId();
