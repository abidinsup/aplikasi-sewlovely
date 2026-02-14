
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvValue = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error("Could not read Supabase credentials from .env.local");
    process.exit(1);
}

async function verify() {
    console.log("Fetching products from Supabase...");
    const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch:", response.status, response.statusText);
        return;
    }

    const products = await response.json();
    const relevant = products.filter(p =>
        p.name.toLowerCase().includes('sprei') ||
        p.name.toLowerCase().includes('bedcover')
    );

    console.log(`Found ${relevant.length} relevant products:`);
    relevant.forEach(p => {
        console.log(`- ${p.name}: Rp ${p.price.toLocaleString('id-ID')}`);
    });
}

verify();
