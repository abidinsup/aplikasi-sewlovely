
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function guessStatus() {
    const statuses = ['pending', 'Active', 'active', 'Pending', 'INACTIVE', 'Inactive'];
    console.log("Testing statuses with dummy required data...");

    for (const s of statuses) {
        console.log(`Testing status: ${s}`);
        const { error } = await supabase
            .from('partners')
            .insert({
                id: '00000000-0000-0000-0000-000000000000',
                full_name: 'Test',
                email: 'test' + Math.random() + '@example.com',
                address: 'Test Address',
                whatsapp_number: '+628123',
                bank_name: 'Test Bank',
                account_holder: 'Test Holder',
                account_number: '12345',
                affiliate_code: 'TEST-' + Math.random(),
                status: s
            });

        if (error) {
            console.log(`Result for ${s}: Error - ${error.message}`);
        } else {
            console.log(`Result for ${s}: SUCCESS!`);
            // Cleanup
            await supabase.from('partners').delete().eq('id', '00000000-0000-0000-0000-000000000000');
        }
    }
}

guessStatus();
