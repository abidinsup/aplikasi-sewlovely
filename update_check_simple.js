
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvValue = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'); // Using Service Role would bypass RLS, but we want to test client-side like 'anon' key behavior unless we use service role

if (!supabaseUrl || !supabaseKey) {
    console.error("Could not read Supabase credentials from .env.local");
    process.exit(1);
}

// NOTE: in the actual app, the user might be authenticated. 
// If RLS allows update ONLY for authenticated users, this script (using anon key without session) will likely fail (count: 0)
// unless the policy is "public can update".
// Let's check what happens with ANON key.

async function testUpdate() {
    console.log("Testing UPDATE with ANON KEY...");

    // 1. Get Target
    const fetchUrl = `${supabaseUrl}/rest/v1/products?select=*&name=ilike.*Sprei%20Single%20Small%20(90x200)*&limit=1`;

    // Header
    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // Return the updated row
    };

    const findResp = await fetch(fetchUrl, { headers });
    const findData = await findResp.json();

    if (!findData || findData.length === 0) {
        console.error("Target Product not found via API.");
        return;
    }

    const target = findData[0];
    console.log(`Target: [${target.id}] ${target.name} | Price: ${target.price}`);

    // 2. Update
    const newPrice = 12345;
    const updateUrl = `${supabaseUrl}/rest/v1/products?id=eq.${target.id}`;

    console.log(`PATCH to ${updateUrl}`);

    const updateResp = await fetch(updateUrl, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ price: newPrice })
    });

    if (!updateResp.ok) {
        console.error("UPDATE FAILED (HTTP Error):", updateResp.status, updateResp.statusText);
        console.error(await updateResp.text());
        return;
    }

    const updateData = await updateResp.json();
    console.log("UPDATE RESPONSE:", updateData);

    if (updateData && updateData.length > 0) {
        if (updateData[0].price === newPrice) {
            console.log("✅ Update SUCCESS via Script (Anon Key).");
            // Revert
            await fetch(updateUrl, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ price: target.price })
            });
        } else {
            console.log("❌ Update returned data but price UNCHANGED.");
        }
    } else {
        console.log("❌ Update returned NO DATA (likely RLS filtered).");
    }
}

testUpdate();
