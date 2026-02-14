const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log('Setting up storage bucket...');

    // 1. Create the bucket
    const { data, error } = await supabase.storage.createBucket('payment-proofs', {
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket "payment-proofs" already exists.');
        } else {
            console.error('Error creating bucket:', error);
            return;
        }
    } else {
        console.log('Bucket "payment-proofs" created successfully.');
    }

    // Note: RLS policies usually need to be set via SQL (Supabase Dashboard or migrations)
    // for storage.objects.
    console.log('Done.');
}

setupStorage();
