"use client";

import { AdminGuard } from "@/components/auth/AdminGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, UserCheck, Package, Settings, LogOut, FileText, CheckCircle, Clock, XCircle, Users, Menu, Blinds, Gift, CreditCard, Calendar, Bell, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";
import Image from "next/image";
import { useAppSettings } from "@/providers/AppSettingsProvider";
import { supabase } from "@/lib/supabase";

import { isAdmin, logout } from "@/lib/auth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLoginPage = pathname === "/admin/login";
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const { appName, isMounted } = useAppSettings();

    // Detailed Counts for Sidebar Badges
    const [counts, setCounts] = React.useState({
        surveys: 0,
        payments: 0,
        withdrawals: 0,
        partners: 0
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const lastCountRef = React.useRef(0);


    // Unified Fetch Logic for Pending Items
    React.useEffect(() => {
        if (isLoginPage) return;

        // Initialize Audio
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audioRef.current.volume = 0.5;

        const fetchAllPendingCounts = async () => {
            try {
                const [
                    { count: surveyCount },
                    { count: paymentCount },
                    { count: withdrawalCount },
                    { count: partnerReqCount },
                    { count: newPartnerCount }
                ] = await Promise.all([
                    supabase.from('survey_schedules').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
                    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'pending'),
                    supabase.from('partner_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
                ]);

                const newCounts = {
                    surveys: surveyCount || 0,
                    payments: paymentCount || 0,
                    withdrawals: withdrawalCount || 0,
                    partners: (partnerReqCount || 0) + (newPartnerCount || 0)
                };

                const newTotal = Object.values(newCounts).reduce((a, b) => a + b, 0);

                // Play sound if count increased
                if (newTotal > lastCountRef.current && lastCountRef.current !== 0) {
                    audioRef.current?.play().catch(e => console.log("Audio play blocked", e));
                }

                setCounts(newCounts);
                lastCountRef.current = newTotal;
            } catch (err) {
                console.error('Error fetching pending counts:', err);
            }
        };

        fetchAllPendingCounts();

        // Refresh every 30 seconds for real-time feel
        const interval = setInterval(fetchAllPendingCounts, 30000);
        return () => clearInterval(interval);
    }, [isLoginPage]);

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
        { icon: Users, label: "Data Mitra", href: "/admin/partners" },
        { icon: Calendar, label: "Jadwal Survey", href: "/admin/surveys", badge: counts.surveys },
        { icon: Calculator, label: "Simulasi Harga", href: "/admin/calculator" },
        { icon: CreditCard, label: "Approval Pembayaran", href: "/admin/payments", badge: counts.payments },
        { icon: Gift, label: "Bonus Manual", href: "/admin/bonus" },
        { icon: Wallet, label: "Approval Penarikan", href: "/admin/withdrawals", badge: counts.withdrawals },
        { icon: UserCheck, label: "Approval Data Mitra", href: "/admin/approvals/partners", badge: counts.partners },
        { icon: Package, label: "Manajemen Produk", href: "/admin/products" },
        { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
    ];

    if (isLoginPage) return <>{children}</>;

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Mobile Header */}
                <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
                    <div className="font-bold text-slate-900">{isMounted ? appName : "Sewlovely Homeset"} Admin</div>
                    <Button variant="ghost" size="icon" className="text-slate-900" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>

                {/* Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden print:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={cn(
                    "fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 text-slate-900 z-50 transform transition-transform duration-300 lg:transform-none flex flex-col print:hidden",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 flex items-center justify-center overflow-hidden">
                                    <Blinds className="h-6 w-6 text-[#00CEC8]" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg leading-none whitespace-nowrap text-slate-900">
                                        {isMounted ? appName : "Sewlovely Homeset"}
                                    </h1>
                                    <span className="text-xs text-slate-500">Owner Panel</span>
                                </div>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                                        <div className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                                            isActive
                                                ? "bg-[#63e5ff] text-slate-900 font-bold shadow-lg shadow-cyan-400/30"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}>
                                            <item.icon className={cn("h-5 w-5", isActive ? "text-slate-900" : "")} />
                                            <span className="text-sm">{item.label}</span>
                                            {item.badge && item.badge > 0 && (
                                                <span className="absolute right-3 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                                    {item.badge > 99 ? "99+" : item.badge}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}

                            {/* Logout Action moved here */}
                            <div className="pt-4 mt-4 border-t border-slate-100">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="flex items-center gap-3 text-slate-500 hover:text-red-500 hover:bg-red-50/50 transition-all duration-200 w-full px-4 py-3 rounded-xl"
                                        >
                                            <LogOut className="h-5 w-5 shrink-0" />
                                            <span className="text-sm font-medium">Logout</span>
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Apakah Anda yakin ingin keluar dari aplikasi?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => {
                                                logout();
                                                router.replace("/login");
                                            }} className="bg-red-500 hover:bg-red-600">
                                                Keluar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </nav>
                    </div>




                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden print:p-0 print:pt-0 relative">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
