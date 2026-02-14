
import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { partnerId } = body;

        if (!partnerId) {
            return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({
                error: 'Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY'
            }, { status: 500 });
        }

        // 1. Update Partner Status in Table
        const { error: dbError } = await supabaseAdmin
            .from('partners')
            .update({ status: 'Active' })
            .eq('id', partnerId);

        if (dbError) {
            console.error('Database update failed:', dbError);
            throw dbError;
        }

        // 2. Confirm User in Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            partnerId,
            { email_confirm: true }
        );

        if (authError) {
            console.error('Auth confirmation failed:', authError);
            // We don't necessarily want to rollback DB if auth fails (it might be already confirmed)
            // But we should log it.
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
