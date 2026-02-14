
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findInvoice() {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .ilike('invoice_number', '%92455863%')
        .limit(1);

    if (error) {
        console.error("Error fetching invoice:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Found Invoice:", data[0]);
    } else {
        console.log("Invoice INV-GRD-92455863 not found.");
    }
}

findInvoice();
