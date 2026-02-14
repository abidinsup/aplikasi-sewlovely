const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugExport() {
    console.log('Testing query...');

    const { data: invoicesRaw, error: invError } = await supabase
        .from('invoices')
        .select(`
                invoice_number,
                total_amount,
                payment_status,
                invoice_type,
                created_at,
                customer_name,
                partners:partner_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(1);

    if (invError) {
        console.error('Query Error:', invError);
        return;
    }

    console.log('Raw Result:', invoicesRaw[0]);

    const mapped = invoicesRaw.map((inv) => ({
        id: inv.invoice_number,
        amount: inv.total_amount,
        status: inv.payment_status,
        type: inv.invoice_type,
        created_at: inv.created_at,
        date: new Date(inv.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }),
        customer: inv.customer_name,
        mitraName: inv.partners?.full_name || "-"
    }));

    console.log('Mapped Result:', mapped[0]);
}

debugExport();
