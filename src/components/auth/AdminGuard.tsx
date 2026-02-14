
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 1. Check if we have a Supabase session
                const { data: { session } } = await supabase.auth.getSession();

                // 2. Check if the user has the admin email (Source of truth)
                const userEmail = session?.user?.email?.toLowerCase();
                const isAdminEmail = userEmail === 'pecintajahit91@gmail.com';

                // 3. Check legacy isAdmin() helper as fallback for consistency
                const hasAdminLocal = isAdmin();

                console.log('AdminGuard Check:', {
                    hasSession: !!session,
                    userEmail,
                    isAdminEmail,
                    hasAdminLocal
                });

                // If we have either a valid admin session OR the local admin flag, permit access
                // This prevents being kicked out during transient session states
                if (isAdminEmail || hasAdminLocal) {
                    setIsLoading(false);
                } else {
                    console.warn('AdminGuard: Unauthorized access attempt, redirecting to login');
                    router.replace("/login");
                }
            } catch (err) {
                console.error('AdminGuard Error:', err);
                // Fallback to local admin check if Supabase fails
                if (isAdmin()) {
                    setIsLoading(false);
                } else {
                    router.replace("/login");
                }
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}
