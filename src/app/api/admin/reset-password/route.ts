
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { partnerId, newPassword } = body;

        if (!partnerId || !newPassword) {
            return NextResponse.json({ error: 'Missing partnerId or newPassword' }, { status: 400 });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({
                error: 'Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY'
            }, { status: 500 });
        }

        // Attempt direct update (assuming partnerId is Auth User ID)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            partnerId,
            { password: newPassword, email_confirm: true }
        );

        if (error) {
            console.error('Update via ID failed:', error);

            // Fallback: Find by email if ID mismatch
            const { data: partnerData } = await supabaseAdmin
                .from('partners')
                .select('email')
                .eq('id', partnerId)
                .single();

            if (partnerData?.email) {
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const user = users.find(u => u.email === partnerData.email);

                if (user) {
                    const { error: retryError } = await supabaseAdmin.auth.admin.updateUserById(
                        user.id,
                        { password: newPassword, email_confirm: true }
                    );
                    if (retryError) throw retryError;
                    return NextResponse.json({ success: true });
                } else {
                    return NextResponse.json({
                        error: 'Akun login (Auth) tidak ditemukan untuk email ini. Silakan hapus dan daftar ulang mitra ini.'
                    }, { status: 404 });
                }
            }
            return NextResponse.json({ error: 'Data mitra tidak ditemukan di database.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
