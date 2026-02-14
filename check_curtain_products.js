
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

async function checkProducts() {
    console.log("Fetching products...");
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
    console.log(`Total products: ${products.length}`);

    // Debug filtering logic from page.tsx
    // const packageBlackout = prices.find(p => p.name.toUpperCase().includes("BLACKOUT") && p.name.toUpperCase().includes("PIPA"))?.price || 0;
    // const packageDimout = prices.find(p => p.name.toUpperCase().includes("DIMOUT") && p.name.toUpperCase().includes("PIPA"))?.price || 0;
    // const packageVitrace = prices.find(p => p.name.toUpperCase().includes("VITRACE") && p.name.toUpperCase().includes("PIPA"))?.price || 0;

    // Updated filtering logic matching page.tsx
    const blackout = products.filter(p => p.name.toUpperCase().includes("BLACKOUT"));
    const dimout = products.filter(p => p.name.toUpperCase().includes("DIMOUT"));
    const vitrace = products.filter(p => p.name.toUpperCase().includes("VITRACE"));

    console.log("\n--- Debugging Matching Logic (New) ---");
    console.log(`Blackout matches: ${blackout.length}`);
    blackout.forEach(p => console.log(`  - [${p.id}] ${p.name}: ${p.price}`));

    console.log(`Dimout matches: ${dimout.length}`);
    dimout.forEach(p => console.log(`  - [${p.id}] ${p.name}: ${p.price}`));

    console.log(`Vitrace matches: ${vitrace.length}`);
    vitrace.forEach(p => console.log(`  - [${p.id}] ${p.name}: ${p.price}`));

    console.log("\n--- All Products involving 'Blackout', 'Dimout', 'Vitrace', 'Pipa' ---");
    const others = products.filter(p => {
        const n = p.name.toUpperCase();
        return n.includes("BLACKOUT") || n.includes("DIMOUT") || n.includes("VITRACE") || n.includes("PIPA");
    });
    others.forEach(p => console.log(`  - [${p.id}] ${p.name}: ${p.price}`));
}

checkProducts();
