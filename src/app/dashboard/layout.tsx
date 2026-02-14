"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Toaster } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [partner, setPartner] = useState<Partner | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const syncSession = async () => {
            const currentPartner = getCurrentPartner();
            if (currentPartner) {
                setPartner(currentPartner);

                // Fetch latest data from database to "heal" stale local storage
                try {
                    const { data: latestPartner, error } = await supabase
                        .from('partners')
                        .select('*')
                        .eq('id', currentPartner.id)
                        .single();

                    if (latestPartner && !error) {
                        // Update state and localStorage if data changed
                        setPartner(latestPartner);
                        localStorage.setItem('sewlovely_partner', JSON.stringify(latestPartner));
                    }
                } catch (err) {
                    console.error("Session sync failed:", err);
                }
            }
        };

        syncSession();
    }, []);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden print:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col min-h-screen print:ml-0 transition-all duration-300 ease-in-out`}>

                    <Header partnerName={partner?.full_name} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                        {children}
                    </main>
                </div>

                <Toaster position="top-center" richColors />
            </div>
        </AuthGuard>
    );
}
