"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import * as React from "react";
import {
    LayoutDashboard,
    ClipboardList,
    Settings,
    User,
    LogOut,
    Blinds,
    Wallet,
    Bell,
    Phone
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { useAppSettings } from "@/providers/AppSettingsProvider";
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
import { logout } from "@/lib/auth";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ClipboardList, label: "Jadwal Survey", href: "/dashboard/survey" },
    { icon: Wallet, label: "Komisi", href: "/dashboard/komisi" },
    { icon: User, label: "Profil Akun", href: "/dashboard/profile" },
    { icon: Settings, label: "Pengaturan", href: "/dashboard/settings" },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { appName, isMounted } = useAppSettings();
    const [partner, setPartner] = React.useState<Partner | null>(null);
    const [pendingCount, setPendingCount] = React.useState(0);

    React.useEffect(() => {
        const currentPartner = getCurrentPartner();
        setPartner(currentPartner);
        fetchPendingInvoices();

        // 30-second auto refresh for badge
        const intervalId = setInterval(() => {
            fetchPendingInvoices();
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchPendingInvoices = async () => {
        try {
            const partner = getCurrentPartner();
            if (!partner?.id) return;

            const { count, error } = await supabase
                .from('invoices')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', partner.id)
                .eq('payment_status', 'pending');

            if (!error && count !== null) {
                setPendingCount(count);
            }
        } catch (err) {
            console.error('Error fetching pending invoices:', err);
        }
    };

    return (
        <aside className={cn(
            "fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out print:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>

            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <Link href="/dashboard" className="flex items-center space-x-3">
                    <div className="relative h-10 w-10 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                        <Blinds className="h-6 w-6 text-emerald-500" />
                    </div>
                    <span className="font-bold text-base tracking-tight text-gray-900 whitespace-nowrap">
                        {isMounted ? appName : "Sewlovely Homeset"}
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const showBadge = item.label === "Jadwal Survey" && pendingCount > 0;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-gray-400")} />
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                                        {pendingCount > 9 ? '9+' : pendingCount}
                                    </span>
                                )}
                            </div>
                            <span>{item.label}</span>
                        </Link>

                    );
                })}

                {/* Action Buttons (Chat & Logout) */}
                <div className="pt-4 mt-4 border-t border-gray-50 space-y-1">
                    {/* Chat Admin Button */}
                    <a
                        href={`https://wa.me/6285159588681?text=${encodeURIComponent(`Halo Admin Sewlovely, saya ${partner?.full_name} (ID: ${partner?.affiliate_code}), ingin bertanya...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-all duration-200 w-full"
                        title="Chat dengan admin, sebutkan nama dan no mitra affiliate"
                    >
                        <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0">
                            <Phone className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="leading-none">Chat Admin</span>
                            <span className="text-[10px] text-emerald-500/70 font-normal mt-0.5 whitespace-nowrap">Sebutkan Nama & ID</span>
                        </div>
                    </a>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl text-sm font-medium">
                                <LogOut className="mr-3 h-5 w-5 shrink-0" />
                                Keluar
                            </Button>
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
                                    window.location.href = '/login';
                                }} className="bg-red-500 hover:bg-red-600">
                                    Keluar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </nav>



        </aside>
    );
}
