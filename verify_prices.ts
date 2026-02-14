
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verify() {
    console.log("Checking Sprei and Bedcover prices...");
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('name.ilike.%Sprei%,name.ilike.%Bedcover%')
        .order('name');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found products:");
        data.forEach(p => {
            console.log(`- ${p.name}: Rp ${p.price.toLocaleString()}`);
        });
    }
}

verify();
