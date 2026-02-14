require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const testId = 'f91bafdc-8798-4444-8888-999999999999'; // Example or real ID?
    // Let's use the real ID from previous debug output
    const realId = 'f91bafdc-67e4-44ed-9a67-68b0f8073809'; // I don't have the full ID yet.

    // Let's fetch the full ID first
    const { data: fetchResult } = await supabase.from('transactions').select('id').ilike('id', 'f91bafdc%').limit(1).single();
    if (!fetchResult) {
        console.error("ID not found");
        return;
    }
    const fullId = fetchResult.id;
    console.log("Full ID:", fullId);

    console.log("Attempting update...");
    const { data, error, count } = await supabase
        .from('transactions')
        .update({ status: 'success' })
        .eq('id', fullId)
        .select();

    if (error) {
        console.error("Update Error:", error);
    } else {
        console.log("Update Success Result:", data);
        if (data.length === 0) {
            console.warn("Update successful but 0 rows affected. Likely RLS issue.");
        }
    }
}

testUpdate();
