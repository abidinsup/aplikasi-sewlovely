
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpc() {
    const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });
    if (error) {
        console.log("RPC exec_sql not found or error:", error.message);
    } else {
        console.log("RPC exec_sql exists!");
    }
}

checkRpc();
