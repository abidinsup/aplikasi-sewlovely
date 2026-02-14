require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
    console.log("Testing Join Survey -> Invoices...");

    const { data, error } = await supabase
        .from('survey_schedules')
        .select(`
            id,
            invoices (
                id,
                commission_paid
            )
        `)
        .eq('status', 'done')
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", JSON.stringify(data, null, 2));
    }
}

testJoin();
