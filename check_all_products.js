require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllProducts() {
    console.log("Fetching all products...");
    const { data: products, error } = await supabase.from('products').select('*');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Total products: ${products.length}\n`);

    const categories = {
        "OFFICE BLINDS": ["ROLLER BLIND", "VERTICAL BLIND", "VENETIAN BLIND"],
        "HOSPITAL BLINDS": ["ANTI BAKTERI", "ANTI DARAH", "REL FLEXY", "REL STANDAR", "REL STANDARD"],
        "SPREI": ["SPREI"],
        "BEDCOVER": ["BEDCOVER"]
    };

    for (const [catName, keywords] of Object.entries(categories)) {
        console.log(`--- ${catName} ---`);
        keywords.forEach(kw => {
            const matches = products.filter(p => p.name.toUpperCase().includes(kw));
            console.log(`${kw}: ${matches.length} matches`);
            matches.forEach(p => console.log(`  - [${p.id}] ${p.name}: ${p.price}`));
        });
        console.log("");
    }
}

checkAllProducts();
