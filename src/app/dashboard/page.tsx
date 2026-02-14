"use client";
// Final Deploy Trigger - Connection Restored

import { Bell, ChevronRight, Home, Building2, PlusSquare, Sparkles, Calendar, BedDouble, Bed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Category Data
const categories = [
    { icon: Home, label: "Gorden Rumah", color: "text-emerald-600 bg-emerald-50" },
    { icon: Building2, label: "Gorden Kantor", color: "text-blue-600 bg-blue-50" },
    { icon: PlusSquare, label: "Gorden RS", color: "text-red-500 bg-red-50" },
];

// Product Data
const products = [
    {
        title: "Sprei Premium",
        description: "Koleksi sprei bahan premium yang lembut dan nyaman.",
        icon: Bed,
        color: "text-emerald-600 bg-emerald-50"
    },
    {
        title: "Bedcover Luxury",
        description: "Bedcover tebal dan hangat dengan berbagai motif menarik.",
        icon: BedDouble,
        color: "text-emerald-600 bg-emerald-50"
    },
];

import { useEffect, useState } from "react";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { useAppSettings } from "@/providers/AppSettingsProvider";
import { ProgressBonusCard } from "@/components/dashboard/ProgressBonusCard";

export default function DashboardPage() {
    const [partner, setPartner] = useState<Partner | null>(null);
    const { sliderTitle, sliderDescription, sliderHighlight, sliderBadge, isMounted } = useAppSettings();

    useEffect(() => {
        setPartner(getCurrentPartner());

        // Refresh partner data every 30s
        const intervalId = setInterval(() => {
            setPartner(getCurrentPartner());
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    const displayName = partner?.full_name || "Mitra";
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-24 pt-6">
            {/* Header Mobile - Only visible on small screens since layout has header */}
            <div className="flex items-center justify-between md:hidden mb-2">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-emerald-100 rounded-full overflow-hidden border-2 border-white shadow-sm relative flex items-center justify-center">
                        <span className="text-emerald-700 font-bold">{initials}</span>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Selamat Datang,</p>
                        <h2 className="text-base font-bold text-gray-900">Halo, {displayName}!</h2>
                    </div>
                </div>
            </div>

            {/* Promo Banner */}
            <div className="relative overflow-hidden rounded-[1.5rem] bg-[#064e3b] text-white p-5 md:p-8 shadow-xl shadow-emerald-900/10 group">
                {/* Abstract Background Pattern */}
                <div className="absolute right-0 top-0 w-40 h-40 md:w-80 md:h-80 opacity-10 transition-transform duration-1000 group-hover:scale-110">
                    <Sparkles className="w-full h-full text-white" />
                </div>
                <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 space-y-2 max-w-[95%] md:max-w-[80%]">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] md:text-xs font-bold tracking-wide uppercase border border-emerald-500/30 backdrop-blur-sm">
                        {isMounted ? sliderBadge : "Info Mitra"}
                    </span>
                    <h3 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight whitespace-pre-line">
                        {isMounted ? sliderTitle : "Raih Bonusnya! \n Selesaikan 5 Pemasangan"}
                    </h3>
                    <p className="text-emerald-100/90 text-sm md:text-base max-w-lg mt-2">
                        {isMounted ? sliderDescription : "Selesaikan 5 pemasangan minggu ini dan dapatkan bonus komisi tambahan"} <span className="font-bold text-yellow-300">{isMounted ? sliderHighlight : "Rp 300.000"}</span>
                    </p>
                </div>
            </div>

            {/* Progress Bonus Card (Target Saya) */}
            <ProgressBonusCard partnerId={partner?.id} />

            {/* Categories */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-2xl md:text-3xl text-gray-900 tracking-tight">Jenis Gorden</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8">
                    {categories.map((cat, idx) => (
                        <Link
                            key={idx}
                            href={
                                cat.label === "Gorden Rumah" ? "/dashboard/calculator/gorden" :
                                    cat.label === "Gorden Kantor" ? "/dashboard/calculator/kantor" :
                                        cat.label === "Gorden RS" ? "/dashboard/calculator/rs" : "#"
                            }
                            className="block h-full"
                        >
                            <div className="bg-white rounded-[2rem] p-6 md:p-10 flex flex-row sm:flex-col items-center sm:justify-center gap-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-emerald-200 hover:-translate-y-2 transition-all duration-300 cursor-pointer group h-full relative overflow-hidden">
                                <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-current opacity-5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150", cat.color)}></div>

                                <div className={cn("w-16 h-16 md:w-24 md:h-24 rounded-3xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md group-hover:shadow-lg", cat.color)}>
                                    <cat.icon className="h-8 w-8 md:h-12 md:w-12" />
                                </div>
                                <div className="flex-1 sm:flex-none text-left sm:text-center z-10">
                                    <span className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-emerald-700 transition-colors block">
                                        {cat.label}
                                    </span>
                                    <span className="text-sm text-gray-400 group-hover:text-emerald-600/60 transition-colors sm:hidden mt-0.5 block">
                                        Mulai Hitung
                                    </span>
                                </div>

                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* AI Consultant Banner */}
            <div className="py-4">
                <Link href="/dashboard/consultant">
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-[1rem] p-1 border border-emerald-100 shadow-sm hover:shadow-lg hover:shadow-emerald-900/10 hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                        <div className="bg-white rounded-[0.8rem] p-3 md:p-5 flex flex-col md:flex-row items-center gap-2 md:gap-5 relative overflow-hidden">

                            {/* Decorative Elements */}
                            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/5 to-transparent skew-x-12 opacity-50"></div>
                            <div className="absolute left-10 top-10 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl"></div>

                            <div className="h-12 w-12 md:h-14 md:w-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-emerald-200 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative z-10">
                                <Sparkles className="text-white h-5 w-5 md:h-6 md:w-6 animate-pulse" />
                            </div>

                            <div className="flex-1 text-center md:text-left relative z-10">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h4 className="font-bold text-sm md:text-base text-gray-900 group-hover:text-emerald-700 transition-colors">Konsultan Desain AI</h4>
                                    <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-emerald-200 tracking-wider shadow-sm">BARU</span>
                                </div>
                                <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed max-w-sm group-hover:text-gray-600 transition-colors">
                                    Bingung pilih warna? Upload foto ruangan Anda dan biarkan AI kami merekomendasikan gorden.
                                </p>
                            </div>

                            <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100 group-hover:border-emerald-100 shadow-sm md:mr-1">
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Product List */}
            <div className="space-y-8 pb-24 md:pb-8">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-2xl md:text-3xl text-gray-900 tracking-tight">Produk Lainnya</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.map((product, idx) => (
                        <Link key={idx} href={(product.title.includes("Sprei") || product.title.includes("Bedcover")) ? "/dashboard/calculator/sprei" : "#"}>
                            <div className="bg-white rounded-[1.5rem] p-5 lg:p-6 flex flex-row lg:flex-col gap-5 lg:gap-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full">
                                <div className={cn("w-16 h-16 lg:w-full lg:h-32 rounded-2xl shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md", product.color)}>
                                    <product.icon className="h-8 w-8 lg:h-12 lg:w-12 text-emerald-700/80" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center lg:items-center lg:text-center">
                                    <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-emerald-700 transition-colors">{product.title}</h4>
                                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">{product.description}</p>
                                </div>
                                <div className="self-center lg:hidden">
                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
