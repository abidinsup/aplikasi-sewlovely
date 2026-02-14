// Script to check invoice and prices
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkInvoice() {
    console.log('=== CHECKING INVOICE INV-KNT-63814184 ===\n');

    // 1. Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', 'INV-KNT-63814184')
        .single();

    if (invoiceError) {
        console.log('Error fetching invoice:', invoiceError.message);
    } else {
        console.log('Invoice found:');
        console.log('  - ID:', invoice.id);
        console.log('  - Type:', invoice.invoice_type);
        console.log('  - Total Amount:', invoice.total_amount);
        console.log('  - Customer:', invoice.customer_name);
        console.log('  - Partner ID:', invoice.partner_id);
        console.log('  - Details:', JSON.stringify(invoice.details, null, 2));
    }

    console.log('\n=== CHECKING KANTOR PRICES ===\n');

    // 2. Get prices for kantor/office products
    const { data: prices, error: pricesError } = await supabase
        .from('products')
        .select('*')
        .ilike('type', '%kantor%');

    if (pricesError) {
        console.log('Error fetching prices:', pricesError.message);
    } else if (prices.length === 0) {
        console.log('No kantor products found, checking all products...');

        const { data: allProducts } = await supabase
            .from('products')
            .select('*');

        console.log('All products:', allProducts?.map(p => ({ type: p.type, name: p.name, price: p.price })));
    } else {
        console.log('Kantor prices:');
        prices.forEach(p => {
            console.log(`  - ${p.name}: Rp ${p.price}`);
        });
    }

    console.log('\n=== CHECKING COMMISSION TRANSACTION ===\n');

    // 3. Check commission transaction for this invoice
    const { data: commission, error: commError } = await supabase
        .from('commission_transactions')
        .select('*')
        .ilike('description', '%INV-KNT-63814184%');

    if (commError) {
        console.log('Error fetching commission:', commError.message);
    } else if (commission.length === 0) {
        console.log('No commission transaction found for this invoice');
    } else {
        console.log('Commission transaction:');
        commission.forEach(c => {
            console.log(`  - Amount: Rp ${c.amount}`);
            console.log(`  - Status: ${c.status}`);
            console.log(`  - Description: ${c.description}`);
        });
    }
}

checkInvoice().then(() => process.exit(0));
