require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWithdrawalExport() {
    console.log("Fetching all withdraw transactions with partner details...");

    const { data: withdrawalsRaw, error: wdExportError } = await supabase
        .from('transactions')
        .select(`
            id,
            created_at,
            amount,
            status,
            partners:partner_id (full_name, bank_name, account_number)
        `)
        .eq('type', 'withdraw')
        .order('created_at', { ascending: false })
        .limit(1);

    if (wdExportError) {
        console.error("Error:", wdExportError);
        return;
    }

    if (withdrawalsRaw.length === 0) {
        console.log("No withdrawals found.");
        return;
    }

    console.log("Raw Data:", JSON.stringify(withdrawalsRaw[0], null, 2));

    const mapped = withdrawalsRaw.map((wd) => ({
        id: wd.id,
        date: new Date(wd.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }),
        created_at: wd.created_at,
        amount: wd.amount,
        status: wd.status,
        mitraName: wd.partners?.full_name || "-",
        bank: wd.partners?.bank_name || "-",
        accountNumber: wd.partners?.account_number || "-"
    }));

    console.log("Mapped Data:", mapped[0]);
}

debugWithdrawalExport();
