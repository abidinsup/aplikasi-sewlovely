const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Extract from relative .env.local manually to avoid many dependencies
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const getEnv = (name) => envFile.match(new RegExp(`${name}=(.*)`))?.[1]?.trim();

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    console.log('Running database migration...');
    const sql = fs.readFileSync(path.join(__dirname, 'add_original_amount_to_invoices.sql'), 'utf8');
    
    // Supabase JS SDK doesn't have a direct 'query' method for raw SQL unless using RPC
    // But since this is a local setup and we want to be thorough:
    // We will try to call a generic SQL execution or just warn the user.
    // However, I can use a simple fetch to the /rest/v1/rpc/exec_sql if it exists
    // (Common pattern in Supabase projects setup by agents)
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.error('Migration failed (RPC exec_sql probably missing):', error);
            console.log('PLEASE MANUAL RUN THIS SQL IN SUPABASE DASHBOARD:');
            console.log(sql);
        } else {
            console.log('Migration successful!');
        }
    } catch (err) {
        console.error('Error running migration:', err);
    }
}

runMigration();
