
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log(`Connecting to: ${supabaseUrl}`);
    try {
        // Try to fetch a simple record from app_settings or one of the tables
        const { data, error } = await supabase
            .from('app_settings')
            .select('key')
            .limit(1);

        if (error) {
            console.error("Supabase Connection Error:", error.message);
            process.exit(1);
        }

        console.log("Supabase Connection: SUCCESS");
        console.log("Data sample:", data);
        process.exit(0);
    } catch (err) {
        console.error("Unexpected Error:", err.message);
        process.exit(1);
    }
}

testConnection();
