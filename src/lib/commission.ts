import { supabase } from './supabase';

// Get current commission percentage from settings
export async function getCommissionPercentage(): Promise<number> {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'commission_percentage')
            .single();

        if (error || !data) {
            return 5; // Default 5%
        }

        return parseFloat(data.value) || 5;
    } catch (err) {
        console.error('Error fetching commission percentage:', err);
        return 5;
    }
}

// Calculate commission from total price
export function calculateCommission(totalPrice: number, percentage: number): number {
    return Math.round((totalPrice * percentage) / 100);
}

// Save commission transaction to database
export async function saveCommissionTransaction(
    partnerId: string,
    invoiceId: string,
    totalPrice: number,
    commissionPercentage: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const commissionAmount = calculateCommission(totalPrice, commissionPercentage);

        const { error } = await supabase
            .from('transactions')
            .insert({
                partner_id: partnerId,
                type: 'commission',
                amount: commissionAmount,
                description: `Komisi ${commissionPercentage}% dari ${invoiceId}`,
                status: 'success',
                invoice_id: invoiceId,
            });

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error('Error saving commission:', err);
        return { success: false, error: err.message };
    }
}

// Add manual bonus to partner
export async function addManualBonus(
    partnerId: string,
    amount: number,
    description: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('transactions')
            .insert({
                partner_id: partnerId,
                type: 'commission',
                amount: amount,
                description: description || 'Bonus dari Admin',
                status: 'success',
            });

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error('Error adding bonus:', err);
        return { success: false, error: err.message };
    }
}

// Get all withdrawals (for admin)
export async function getWithdrawals() {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                partners (
                    full_name,
                    email,
                    bank_name,
                    account_number,
                    affiliate_code
                )
            `)
            .eq('type', 'withdraw')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error('Error fetching withdrawals:', err);
        return { success: false, error: err.message };
    }
}

// Approve withdrawal
export async function approveWithdrawal(transactionId: string, proofUrl?: string) {
    const updateData: any = { status: 'success' };
    if (proofUrl) {
        updateData.proof_url = proofUrl;
    }

    const { data, error } = await supabase
        .from('transactions')
        .update(updateData) // Marked as success to count as withdrawn
        .eq('id', transactionId)
        .select();

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error("Gagal memperbarui status. Pastikan data ada dan Anda memiliki izin akses.");
    }
    return { success: true };
}

// Reject withdrawal
export async function rejectWithdrawal(transactionId: string) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'rejected' }) // Marked as rejected to return to balance
        .eq('id', transactionId)
        .select();

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error("Gagal membatalkan status. Pastikan data ada dan Anda memiliki izin akses.");
    }
    return { success: true };
}

// Get Admin Dashboard Stats
export async function getAdminDashboardStats() {
    try {
        // 1. Total Omset (Sum of all invoices) & Data for Export
        const { data: invoicesRaw, error: invError } = await supabase
            .from('invoices')
            .select(`
                invoice_number,
                total_amount,
                payment_status,
                invoice_type,
                created_at,
                customer_name,
                partners:partner_id (full_name)
            `)
            .order('created_at', { ascending: false });

        if (invError) throw invError;

        // Map invoices to clean format
        // Manually map from raw column names to our desired keys
        const invoices = invoicesRaw?.map((inv: any) => ({
            id: inv.invoice_number,
            amount: inv.total_amount,
            status: inv.payment_status,
            type: inv.invoice_type,
            created_at: inv.created_at,
            date: new Date(inv.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }),
            customer: inv.customer_name,
            mitraName: inv.partners?.full_name || "-"
        })) || [];

        const totalOmset = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;

        // 2. Pending Withdrawals
        const { count: pendingWithdrawals, error: wdError } = await supabase
            .from('transactions')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'withdraw')
            .eq('status', 'pending');

        if (wdError) throw wdError;

        // 3. Total Mitra
        const { count: totalMitra, error: partnerError } = await supabase
            .from('partners')
            .select('id', { count: 'exact', head: true });

        if (partnerError) throw partnerError;

        // 4. All Withdrawals (For Export)
        const { data: withdrawalsRaw, error: wdExportError } = await supabase
            .from('transactions')
            .select(`
                id,
                created_at,
                amount,
                status,
                partners:partner_id (full_name, bank_name, account_number)
            `)
            .eq('type', 'withdraw')
            .order('created_at', { ascending: false });

        if (wdExportError) throw wdExportError;

        const allWithdrawals = withdrawalsRaw?.map((wd: any) => ({
            id: wd.id,
            date: new Date(wd.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }),
            created_at: wd.created_at,
            amount: wd.amount,
            status: wd.status,
            mitraName: wd.partners?.full_name || "-",
            bank: wd.partners?.bank_name || "-",
            accountNumber: wd.partners?.account_number || "-"
        })) || [];

        // 5. Recent Transactions (Invoices) - Reuse mapped invoices or fetch limit 5
        const recent = invoices.slice(0, 5);

        return {
            success: true,
            data: {
                totalOmset,
                pendingWithdrawals: pendingWithdrawals || 0,
                totalMitra: totalMitra || 0,
                recentTransactions: recent,
                allInvoices: invoices, // For chart generation & Export
                allWithdrawals: allWithdrawals // For Export
            }
        };

    } catch (err: any) {
        console.error('Error fetching admin dashboard stats:', err);
        return { success: false, error: err.message };
    }
}

// PARTNER DATA APPROVAL FUNCTIONS

// Create a new request for data change
export async function createPartnerRequest(
    partnerId: string,
    type: 'bank' | 'phone',
    oldData: string,
    newData: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('partner_requests')
            .insert({
                partner_id: partnerId,
                type,
                old_data: oldData,
                new_data: newData,
                status: 'pending'
            });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error creating partner request:', err);
        return { success: false, error: err.message };
    }
}

// Get all pending requests (Admin)
export async function getPartnerRequests() {
    try {
        const { data, error } = await supabase
            .from('partner_requests')
            .select(`
                *,
                partners (
                    full_name,
                    affiliate_code
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error('Error fetching partner requests:', err);
        return { success: false, error: err.message };
    }
}

// Approve request
export async function approvePartnerRequest(requestId: string, partnerId: string, type: 'bank' | 'phone', newData: string) {
    try {
        // 1. Update Request Status
        const { error: reqError } = await supabase
            .from('partner_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        if (reqError) throw reqError;

        // 2. Update Partner Data
        let updateData: any = {};
        if (type === 'phone') {
            updateData.whatsapp_number = newData; // Ensure format is correct outside or here
        } else if (type === 'bank') {
            // New data for bank is a bit complex as it's a JSON string or combined string?
            // The implementation plan says "new_data" text. 
            // We need to parse it if it contains multiple fields (Bank Name + Account + Number)
            // Or we assume new_data is a JSON string.
            // Let's assume passed newData is JSON stringified for Bank, or handle it in the UI to pass partials.
            // For simplicity in this function, let's assume newData contains the specific field value OR we parse it.
            // Wait, previous Settings page split Bank Name, Account, Number.
            // We should store them as JSON in new_data for 'bank' type changes.
            try {
                const parsed = JSON.parse(newData);
                updateData = { ...parsed };
            } catch (e) {
                // If not JSON, maybe just one field? But bank has 3 fields.
                // Fallback or error.
                console.error("Failed to parse bank data", e);
                return { success: false, error: "Invalid data format" };
            }
        }

        const { error: partnerError } = await supabase
            .from('partners')
            .update(updateData)
            .eq('id', partnerId);

        if (partnerError) throw partnerError;

        return { success: true };
    } catch (err: any) {
        console.error('Error approving request:', err);
        return { success: false, error: err.message };
    }
}

// Reject request
export async function rejectPartnerRequest(requestId: string) {
    try {
        const { error } = await supabase
            .from('partner_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error rejecting request:', err);
        return { success: false, error: err.message };
    }
}

// Delete partner and related data via Secure API
export async function deletePartner(partnerId: string) {
    try {
        const response = await fetch('/api/admin/delete-partner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partnerId }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal menghapus mitra');

        return { success: true };
    } catch (err: any) {
        console.error('Error deleting partner:', err);
        return { success: false, error: err.message || 'Gagal menghapus data mitra.' };
    }
}

// PARTNER MANAGEMENT FUNCTIONS

// Get aggregated partner list (Admin)
export async function getPartnersList() {
    try {
        const commissionPercentage = await getCommissionPercentage();
        const { data: partners, error } = await supabase
            .from('partners')
            .select(`
                id,
                full_name,
                created_at,
                status,
                address,
                birth_date,
                whatsapp_number,
                email,
                bank_name,
                account_number,
                account_holder,
                affiliate_code,
                invoices:invoices!partner_id(total_amount, payment_status),
                transactions:transactions!partner_id(type, amount, status)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process data to calculate total sales and commission stats
        const formattedPartners = partners.map((p: any) => {
            // Sales Stats
            const totalSales = p.invoices
                ?.filter((inv: any) => inv.payment_status === 'paid')
                .reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0) || 0;

            // Commission Stats
            let totalCommission = 0;
            let totalWithdrawn = 0;
            let pendingWithdrawal = 0;

            if (p.transactions) {
                p.transactions.forEach((tx: any) => {
                    const amount = Number(tx.amount) || 0;
                    if (tx.type === 'commission' && tx.status === 'success') {
                        totalCommission += amount;
                    } else if (tx.type === 'withdraw') {
                        if (tx.status === 'success') {
                            totalWithdrawn += amount;
                        } else if (tx.status === 'pending') {
                            pendingWithdrawal += amount;
                        }
                    }
                });
            }

            const availableBalance = totalCommission - totalWithdrawn - pendingWithdrawal;

            return {
                id: p.id,
                name: p.full_name,
                joinDate: new Date(p.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }),
                status: p.status || 'Active', // Default to Active if null
                totalSales: totalSales,
                originalId: p.id, // Keep UUID for operations
                // Full Details
                email: p.email,
                phone: p.whatsapp_number,
                address: p.address,
                birthDate: p.birth_date,
                bankName: p.bank_name,
                accountNumber: p.account_number,
                accountHolder: p.account_holder,
                affiliateCode: p.affiliate_code,
                // Financial Stats
                totalCommission,
                totalWithdrawn,
                pendingWithdrawal,
                availableBalance,
                commissionPercentage
            };
        });

        return { success: true, data: formattedPartners };
    } catch (err: any) {
        console.error('Error fetching partner list:', err);
        return { success: false, error: err.message };
    }
}

// Update partner status (Active/Inactive)
export async function updatePartnerStatus(partnerId: string, status: 'Active' | 'Inactive') {
    try {
        const { error } = await supabase
            .from('partners')
            .update({ status })
            .eq('id', partnerId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error('Error updating partner status:', err);
        return { success: false, error: err.message };
    }
}
// Update partner password (Admin Only)
export async function updatePartnerPassword(partnerId: string, newPassword: string) {
    try {
        // 1. Update Supabase Auth via API
        const response = await fetch('/api/admin/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ partnerId, newPassword }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update auth password');
        }

        // 2. Update Local Table (for display purposes only)
        const { error } = await supabase
            .from('partners')
            .update({ password: newPassword })
            .eq('id', partnerId);

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error('Error updating partner password:', err);
        return { success: false, error: err.message };
    }
}
