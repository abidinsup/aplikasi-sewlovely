
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

        // 1. Get partner email to delete from Auth as well
        const { data: partnerData } = await supabaseAdmin
            .from('partners')
            .select('email')
            .eq('id', partnerId)
            .single();

        // 2. Delete transactions
        const { error: transError } = await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('partner_id', partnerId);

        if (transError) throw transError;

        // 3. Delete partner requests
        const { error: reqError } = await supabaseAdmin
            .from('partner_requests')
            .delete()
            .eq('partner_id', partnerId);

        if (reqError) throw reqError;

        // 4. Unlink invoices
        await supabaseAdmin
            .from('invoices')
            .update({ partner_id: null })
            .eq('partner_id', partnerId);

        // 5. Delete from partners table
        const { error: tableError } = await supabaseAdmin
            .from('partners')
            .delete()
            .eq('id', partnerId);

        if (tableError) throw tableError;

        // 6. Delete from Auth if exists
        if (partnerData?.email) {
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const user = users.find(u => u.email === partnerData.email);
            if (user) {
                await supabaseAdmin.auth.admin.deleteUser(user.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
