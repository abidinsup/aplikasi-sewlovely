
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
    console.log("Checking constraints for 'partners' table...");

    const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'partners' });

    if (error) {
        console.error("RPC Error (it might not exist):", error);

        // Fallback: try to query information_schema directly if we can
        const { data: constraints, error: queryError } = await supabase
            .from('pg_constraint')
            .select('conname, pg_get_constraintdef(oid)')
            .filter('conrelid', 'eq', "'public.partners'::regclass");

        // Wait, standard Supabase doesn't allow raw SQL easily without RPC.
        // Let's try to just insert a dummy and see error again or guess.
    } else {
        console.log("Constraints:", data);
    }
}

// Since I might not have the RPC, I'll try to just check the error by trying different values
async function guessStatus() {
    const statuses = ['pending', 'Active', 'active', 'Pending', 'INACTIVE', 'Inactive'];
    console.log("Testing statuses one by one...");

    for (const s of statuses) {
        console.log(`Testing status: ${s}`);
        const { error } = await supabase
            .from('partners')
            .insert({
                id: '00000000-0000-0000-0000-000000000000', // Dummy
                full_name: 'Test',
                email: 'test@example.com',
                status: s
            });

        if (error) {
            console.log(`Result for ${s}: Error - ${error.message}`);
        } else {
            console.log(`Result for ${s}: SUCCESS!`);
            // Cleanup
            await supabase.from('partners').delete().eq('id', '00000000-0000-0000-0000-000000000000');
            break;
        }
    }
}

guessStatus();
