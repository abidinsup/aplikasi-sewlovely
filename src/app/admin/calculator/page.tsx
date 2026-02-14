"use client";

import Link from "next/link";
import { Home, Building2, HeartPulse, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const calculatorTypes = [
    {
        id: "gorden",
        title: "Gorden Rumah",
        description: "Simulasi harga gorden untuk rumah tinggal dengan berbagai pilihan kain dan model",
        icon: Home,
        href: "/admin/calculator/gorden",
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
    },
    {
        id: "kantor",
        title: "Gorden Kantor",
        description: "Simulasi harga gorden untuk perkantoran dengan desain profesional",
        icon: Building2,
        href: "/admin/calculator/kantor",
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
    },
    {
        id: "rs",
        title: "Gorden RS/Klinik",
        description: "Simulasi harga gorden untuk rumah sakit dan klinik dengan standar medis",
        icon: HeartPulse,
        href: "/admin/calculator/rs",
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
    },
];

export default function AdminCalculatorPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulasi Harga</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Pilih jenis simulasi untuk menghitung estimasi harga gorden
                </p>
            </div>

            {/* Calculator Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {calculatorTypes.map((type) => (
                    <Link
                        key={type.id}
                        href={type.href}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                            type.bgColor,
                            type.borderColor
                        )}
                    >
                        <div className="space-y-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                                type.color
                            )}>
                                <type.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{type.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                            </div>
                            <div className="flex items-center text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                <span>Buka Simulasi</span>
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                    <strong>Info:</strong> Halaman ini hanya untuk simulasi harga. Untuk membuat invoice resmi, gunakan menu Jadwal Survey.
                </p>
            </div>
        </div>
    );
}
