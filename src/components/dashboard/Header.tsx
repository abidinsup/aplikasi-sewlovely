"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Bell } from "lucide-react";
import { logout, getCurrentPartner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as React from "react";

interface HeaderProps {
    onMenuClick?: () => void;
    partnerName?: string;
}

export function Header({ onMenuClick, partnerName }: HeaderProps) {
    const router = useRouter();
    const lastCheckRef = React.useRef<string>(new Date().toISOString());

    // Polling for Notifications
    React.useEffect(() => {
        const partner = getCurrentPartner();
        if (!partner?.id) return;

        const checkNotifications = async () => {
            try {
                // 1. Check for Status Changes in Surveys
                const { data: surveys, error: surveyError } = await supabase
                    .from('survey_schedules')
                    .select('id, customer_name, status, updated_at')
                    .eq('partner_id', partner.id)
                    .gt('updated_at', lastCheckRef.current)
                    .order('updated_at', { ascending: false });

                if (!surveyError && surveys && surveys.length > 0) {
                    surveys.forEach(s => {
                        toast.info(`Status survey ${s.customer_name} berubah menjadi "${s.status}"`, {
                            description: "Cek riwayat survey Anda untuk detailnya.",
                            duration: 5000,
                        });
                    });
                }

                // 2. Check for New Success Transactions (Commissions)
                const { data: trans, error: transError } = await supabase
                    .from('transactions')
                    .select('id, amount, type, created_at')
                    .eq('partner_id', partner.id)
                    .eq('status', 'success')
                    .gt('created_at', lastCheckRef.current)
                    .order('created_at', { ascending: false });

                if (!transError && trans && trans.length > 0) {
                    trans.forEach(t => {
                        if (t.type === 'commission') {
                            toast.success(`Komisi Baru Masuk!`, {
                                description: `Rp ${Number(t.amount).toLocaleString('id-ID')} telah ditambahkan ke saldo Anda.`,
                                duration: 8000,
                            });
                        }
                    });
                }

                // Update last check time
                lastCheckRef.current = new Date().toISOString();
            } catch (err) {
                console.error("Notification check error:", err);
            }
        };

        // Initial check after a short delay
        const timeoutId = setTimeout(checkNotifications, 2000);

        // Poll every 45 seconds
        const intervalId = setInterval(checkNotifications, 45000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const displayName = partnerName || "Mitra";
    const initials = getInitials(displayName);

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 print:hidden">

            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            <div className="flex items-center space-x-3">
                <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 font-medium">Mitra Affiliate</p>
                    </div>
                    <Link href="/dashboard/profile">
                        <div className="h-9 w-9 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-105 transition-transform cursor-pointer">
                            <span className="font-bold text-sm text-emerald-700">{initials}</span>
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
