
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

// Manual fetch with no-cache equivalent
async function verifyZero() {
    console.log("Checking for ZERO priced products...");

    const url = `${supabaseUrl}/rest/v1/products?select=*`;

    // Log the URL and headers for debugging (masked)
    console.log("Fetching from:", url);

    const response = await fetch(url, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (!response.ok) {
        console.error("Fetch Error:", response.status, response.statusText);
        const text = await response.text();
        console.error("Body:", text);
        return;
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
        console.error("Response is not an array:", products);
        return;
    }

    const spreis = products.filter(p => p.name.toLowerCase().includes('sprei'));

    console.log(`Found ${spreis.length} Sprei products.`);
    spreis.forEach(p => {
        console.log(`[${p.id}] ${p.name}: Rp ${p.price}`);
    });
}

verifyZero();
