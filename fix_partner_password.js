
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// CRITICAL: This script NEEDS the service role key to manage users.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL.');
    process.exit(1);
}

if (!supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    // ...error message...
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixPartnerAccess() {
    const email = 'abidin1190@gmail.com';
    const password = 'dagdigdug#11';

    console.log(`Fixing access for: ${email}`);

    // 1. Get Partner from DB to find the correct ID
    const { data: partner, error: dbError } = await supabase
        .from('partners')
        .select('id, email')
        .eq('email', email)
        .single();

    if (dbError || !partner) {
        console.error('Error: Partner not found in database table!', dbError);
        return;
    }

    console.log(`Found partner in DB with ID: ${partner.id}`);

    // 2. Check if User exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const authUser = users.find(u => u.email === email);

    if (authUser) {
        console.log(`User found in Auth (ID: ${authUser.id}). Updating password...`);
        // Update Password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            authUser.id,
            { password: password, email_confirm: true }
        );

        if (updateError) {
            console.error('Failed to update password:', updateError);
        } else {
            console.log('✅ Password updated successfully!');
        }

        if (authUser.id !== partner.id) {
            console.warn('⚠️ WARNING: Auth User ID does NOT match Partner Table ID!');
            console.log(`Auth ID: ${authUser.id}`);
            console.log(`Partner ID: ${partner.id}`);
            console.log('You might need to update the partners table ID to match Auth ID.');
        }

    } else {
        console.log(`User NOT found in Auth. Creating new user with ID: ${partner.id}...`);

        // Create User with specific ID to match table
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: 'Abidin' },
            id: partner.id // CRITICAL: Force the ID to match
        });

        if (createError) {
            console.error('Failed to create user:', createError);
        } else {
            console.log('✅ User created successfully in Supabase Auth!');
            console.log(`ID: ${newUser.user.id}`);
            console.log(`Email: ${newUser.user.email}`);
            console.log(`Password: ${password}`);
        }
    }
}

fixPartnerAccess();
