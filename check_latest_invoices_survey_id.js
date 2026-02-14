require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestInvoices() {
    console.log("Checking latest 5 invoices for survey_id...");

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
            id,
            invoice_number,
            created_at,
            survey_id,
            payment_status
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching invoices:", error);
    } else {
        console.log(JSON.stringify(invoices, null, 2));
    }
}

checkLatestInvoices();
