import { supabase } from './supabase';

// Tipe data Partner
export interface Partner {
    id: string;
    full_name: string;
    email: string;
    affiliate_code: string;
    whatsapp_number: string;
    address: string;
    birth_date?: string;
    bank_name: string;
    account_holder: string;
    account_number: string;
    status?: string;
}

// Key untuk localStorage (Legacy & Admin)
const PARTNER_KEY = 'sewlovely_partner';
const ADMIN_KEY = 'sewlovely_admin_session';

// Login dengan email dan password menggunakan Supabase Auth
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; partner?: Partner; error?: string }> {
    try {
        // 1. Attempt login with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password: password,
        });

        if (authError) {
            // Fallback: Check if user exists in legacy 'partners' table but not in Auth yet
            // This is crucial for smooth migration without breaking existing users immediately
            // Ideally, we should migrate users, but for now, let's keep the old check as a fallback if Auth fails
            // OR return specific error
            return {
                success: false,
                error: authError.message === 'Invalid login credentials'
                    ? 'Email atau password salah.'
                    : authError.message
            };
        }

        if (!authData.user) {
            return { success: false, error: 'Gagal login. Silakan coba lagi.' };
        }

        // 2. Fetch Partner Profile from Database
        const { data: partnerData, error: profileError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', authData.user.id) // Assuming Auth UID matches Partner ID (Best Practice)
            // OR .eq('email', email) if IDs are different during migration phase
            .single();

        let data = partnerData;

        if (profileError || !data) {
            // If profile not found, maybe fetch by email as backup
            const { data: partnerDataByEmail, error: emailProfileError } = await supabase
                .from('partners')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (emailProfileError || !partnerDataByEmail) {
                // DON'T sign out if it's the special admin email
                if (email.toLowerCase() !== 'pecintajahit91@gmail.com') {
                    await supabase.auth.signOut(); // Logout if no profile found
                }
                return { success: false, error: 'Profil mitra tidak ditemukan.' };
            }

            // Use the email-matched data if ID-matched failed
            data = partnerDataByEmail;
        }

        // Check if partner is active
        if (data.status === 'Inactive') {
            await supabase.auth.signOut();
            return {
                success: false,
                error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.'
            };
        }

        // Simpan ke localStorage (masih dipakai untuk caching di frontend biar cepat)
        const partner: Partner = {
            id: data.id,
            full_name: data.full_name,
            email: data.email,
            affiliate_code: data.affiliate_code,
            whatsapp_number: data.whatsapp_number,
            address: data.address,
            birth_date: data.birth_date,
            bank_name: data.bank_name,
            account_holder: data.account_holder,
            account_number: data.account_number,
            status: data.status
        };

        localStorage.setItem(PARTNER_KEY, JSON.stringify(partner));
        return { success: true, partner };

    } catch (err: any) {
        console.error("Login error details:", err);
        return {
            success: false,
            error: err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.'
        };
    }
}

// Get current logged in partner
export function getCurrentPartner(): Partner | null {
    if (typeof window === 'undefined') return null;

    // Prioritize localStorage for instant UI rendering
    const stored = localStorage.getItem(PARTNER_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as Partner;
    } catch {
        return null;
    }
}

// Refesh Session (Optional helper)
export async function refreshSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Update localStorage if needed
    }
}

// Logout
export async function logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem(PARTNER_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem('newPartnerCode');
    localStorage.removeItem('newPartnerName');

    // Clear cookies if any
    document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
}

// Login as Admin
export function loginAsAdmin(): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_KEY, 'true');
    }
}

// Check if is admin
export function isAdmin(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_KEY) === 'true';
}

// Check if logged in
export function isLoggedIn(): boolean {
    return getCurrentPartner() !== null;
}
