
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

async function checkDuplicates() {
    console.log("Checking for DUPLICATE products...");

    // Simplest URL
    const url = `${supabaseUrl}/rest/v1/products?select=*&order=id.asc`;

    const response = await fetch(url, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    if (!response.ok) {
        console.error("Fetch failed:", response.status, response.statusText);
        console.error(await response.text());
        return;
    }

    const products = await response.json();

    // Flexible filter
    const items = products.filter(p =>
        p.name.toLowerCase().includes('bedcover') ||
        p.name.toLowerCase().includes('sprei')
    );

    console.log(`Found ${items.length} Sprei/Bedcover items:`);
    items.forEach(p => {
        console.log(`[ID: ${p.id}] ${p.name} - Rp ${p.price}`);
    });

    // Check for "same normalized name"
    const nameMap = {};
    items.forEach(p => {
        const norm = p.name.trim().toLowerCase().replace(/\s+/g, ' '); // Normalize spaces
        if (!nameMap[norm]) {
            nameMap[norm] = [];
        }
        nameMap[norm].push(p);
    });

    console.log("\n--- DUPLICATE REPORT ---");
    let dupCount = 0;
    for (const [name, list] of Object.entries(nameMap)) {
        if (list.length > 1) {
            console.log(`DUPLICATE FOUND for: "${name}"`);
            list.forEach(p => console.log(`   - ID: ${p.id} | Price: ${p.price}`));
            dupCount++;
        }
    }

    if (dupCount === 0) {
        console.log("No duplicates found based on normalized names.");
    }
}

checkDuplicates();
