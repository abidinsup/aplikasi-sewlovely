
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestInvoice() {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching invoice:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Latest Invoice:", data[0]);
        console.log("Has survey_id?", !!data[0].survey_id);
        console.log("Survey ID:", data[0].survey_id);
    } else {
        console.log("No invoices found.");
    }
}

checkLatestInvoice();
