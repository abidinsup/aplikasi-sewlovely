
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

// Mock data definitions from valid code
const SPREI_SIZES = [
    { id: 'S-90', size: '90x200', label: 'Single Small', nameRef: 'Sprei Single Small (90x200)', price: 150000 },
    { id: 'S-100', size: '100x200', label: 'Single', nameRef: 'Sprei Single (100x200)', price: 165000 },
    { id: 'S-120', size: '120x200', label: 'Double / Super Single', nameRef: 'Sprei Double (120x200)', price: 180000 },
    { id: 'S-160', size: '160x200', label: 'Queen', nameRef: 'Sprei Queen (160x200)', price: 220000 },
    { id: 'S-180', size: '180x200', label: 'King', nameRef: 'Sprei King (180x200)', price: 240000 },
    { id: 'S-200', size: '200x200', label: 'Extra King', nameRef: 'Sprei Extra King (200x200)', price: 260000 },
];

const BEDCOVER_SIZES = [
    { id: 'BC-100', size: '100x200', label: 'Single', nameRef: 'Bedcover Single (100x200)', price: 300000 },
    { id: 'BC-120', size: '120x200', label: 'Super Single', nameRef: 'Bedcover Super Single (120x200)', price: 325000 },
    { id: 'BC-160', size: '160x200', label: 'Queen', nameRef: 'Bedcover Queen (160x200)', price: 400000 },
    { id: 'BC-180', size: '180x200', label: 'King', nameRef: 'Bedcover King (180x200)', price: 450000 },
    { id: 'BC-200', size: '200x200', label: 'Super King', nameRef: 'Bedcover Super King (200x200)', price: 500000 },
];

async function debugLogic() {
    // 1. Fetch ALL products
    const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const products = await response.json();
    console.log(`Loaded ${products.length} products from DB.\n`);

    // 2. Simulate current logic
    console.log("--- DEBUGGING SPREI LOGIC ---");
    SPREI_SIZES.forEach(s => {
        const normalizedType = 'sprei';
        const normalizedSize = s.size.toLowerCase();

        // FIND ALL MATCHES first to see potential conflicts
        const allMatches = products.filter(p => {
            const name = p.name.toLowerCase();
            return name.includes(normalizedType) && name.includes(normalizedSize);
        });

        const selected = allMatches[0]; // Logic uses find(), so first one wins

        console.log(`Target: Sprei ${s.size}`);
        if (selected) {
            console.log(`   MATCH OPENED: [${selected.name}] -> Rp ${selected.price}`);
            if (allMatches.length > 1) {
                console.log(`   WARNING: Found ${allMatches.length} candidates!`);
                allMatches.forEach(m => console.log(`      - ${m.name} (${m.price})`));
            }
        } else {
            console.log(`   NO MATCH FOUND. Fallback to: Rp ${s.price}`);
        }
        console.log("");
    });

    console.log("--- DEBUGGING BEDCOVER LOGIC ---");
    BEDCOVER_SIZES.forEach(b => {
        const normalizedType = 'bedcover';
        const normalizedSize = b.size.toLowerCase();

        const allMatches = products.filter(p => {
            const name = p.name.toLowerCase();
            return name.includes(normalizedType) && name.includes(normalizedSize);
        });

        const selected = allMatches[0];

        console.log(`Target: Bedcover ${b.size}`);
        if (selected) {
            console.log(`   MATCH OPENED: [${selected.name}] -> Rp ${selected.price}`);
            if (allMatches.length > 1) {
                console.log(`   WARNING: Found ${allMatches.length} candidates!`);
            }
        } else {
            console.log(`   NO MATCH FOUND. Fallback to: Rp ${b.price}`);
        }
        console.log("");
    });
}

debugLogic();
