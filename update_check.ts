
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Manual env loading because we are running with ts-node
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvValue = (key: string) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL')!;
const supabaseKey = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log("Testing UPDATE permission on 'products' table...");

    // 1. Get a target product (Sprei Single Small)
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .ilike('name', '%Sprei Single Small%')
        .limit(1);

    if (!products || products.length === 0) {
        console.error("Target product not found!");
        return;
    }

    const target = products[0];
    console.log(`Target: [${target.id}] ${target.name} | Current Price: ${target.price}`);

    // 2. Try to update price to 12345
    const newPrice = 12345;
    console.log(`Attempting to update price to ${newPrice}...`);

    const { data, error, count } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', target.id)
        .select();

    if (error) {
        console.error("UPDATE ERROR:", error);
    } else {
        console.log("UPDATE SUCCESS (Mock). Result:", data);
        if (data && data.length > 0) {
            console.log(`New Price in DB: ${data[0].price}`);
            if (data[0].price === newPrice) {
                console.log("✅ Update PERSISTED successfully.");

                // Revert
                console.log("Reverting price...");
                await supabase.from('products').update({ price: target.price }).eq('id', target.id);
            } else {
                console.log("❌ Update returned success but price DID NOT CHANGE.");
            }
        } else {
            console.log("❌ Update returned success but NO ROWS were returned (RLS blocking headers?).");
        }
    }
}

testUpdate();
