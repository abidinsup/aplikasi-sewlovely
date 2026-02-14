"use client";

import * as React from "react";
import { User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const [partner, setPartner] = React.useState<Partner | null>(null);

    React.useEffect(() => {
        const fetchLatestData = async () => {
            const currentPartner = getCurrentPartner();
            if (currentPartner) {
                // Fetch latest data from database to avoid stale localStorage
                const { data, error } = await supabase
                    .from('partners')
                    .select('*')
                    .eq('id', currentPartner.id)
                    .single();

                if (data && !error) {
                    setPartner(data);
                } else {
                    setPartner(currentPartner);
                }
            }
        };

        fetchLatestData();
    }, []);

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Format date for display
    const formatJoinDate = () => {
        // For now return static date, can be made dynamic later
        return "Februari 2026";
    };

    // Format date string to dd/mm/yyyy
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    if (!partner) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20 pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profil Akun</h1>
                    <p className="text-gray-500 mt-1">Informasi pribadi dan detail keanggotaan Anda.</p>
                </div>
                <Link href="/dashboard/settings">
                    <Button variant="outline" className="gap-2 rounded-xl h-12 px-6 border-slate-200">
                        Ubah Profil / Pengaturan
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Main Identity Card (Full Width Top) */}
                <div className="lg:col-span-12">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/15 transition-all duration-1000"></div>
                        <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-emerald-100 text-xs font-medium mb-2 bg-white/10 inline-block px-3 py-1 rounded-full backdrop-blur-md border border-white/10">Kode Afiliasi Anda</p>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-wider font-mono text-white drop-shadow-sm">{partner.affiliate_code}</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-[1.5rem] backdrop-blur-md border border-white/10 min-w-[240px]">
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-lg shadow-lg ring-4 ring-white/20">
                                    {getInitials(partner.full_name)}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-white">{partner.full_name}</p>
                                    <p className="text-xs text-emerald-100">Mitra sejak {formatJoinDate()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Column: Biodata */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                        <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-6">
                            <div className="bg-emerald-50 p-3 rounded-2xl">
                                <User className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">Biodata Diri</h3>
                                <p className="text-sm text-slate-500">Informasi pribadi yang terdaftar</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Nama Lengkap"
                                    value={partner.full_name}
                                    readOnly
                                    className="bg-slate-50 border-slate-100 h-12"
                                />
                                <Input
                                    label="Tanggal Lahir"
                                    value={formatDate(partner.birth_date)}
                                    readOnly
                                    className="bg-slate-50 border-slate-100 h-12"
                                />
                            </div>

                            <Input
                                label="Alamat Email"
                                value={partner.email}
                                readOnly
                                className="bg-slate-50 border-slate-100 h-12"
                            />

                            <Input
                                label="Nomor WhatsApp"
                                value={partner.whatsapp_number}
                                readOnly
                                className="bg-slate-50 border-slate-100 h-12"
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Alamat Lengkap</label>
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-gray-600 focus:outline-none resize-none cursor-default leading-relaxed"
                                    value={partner.address}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bank Info */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 h-full">
                        <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-6">
                            <div className="bg-emerald-50 p-3 rounded-2xl">
                                <CreditCard className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">Rekening Terdaftar</h3>
                                <p className="text-sm text-slate-500">Untuk keperluan pencairan komisi</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="Nama Bank"
                                value={partner.bank_name}
                                readOnly
                                className="bg-slate-50 border-slate-100 h-12"
                            />

                            <Input
                                label="Nomor Rekening"
                                value={partner.account_number}
                                readOnly
                                className="bg-slate-50 border-slate-100 font-mono text-lg tracking-wide h-12"
                            />

                            <Input
                                label="Nama Pemilik Rekening"
                                value={partner.account_holder}
                                readOnly
                                className="bg-slate-50 border-slate-100 h-12"
                            />

                            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                                <p className="text-sm text-emerald-800 leading-relaxed">
                                    <span className="font-bold block mb-1">Catatan Penting:</span>
                                    Data rekening ini digunakan untuk pencairan komisi
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
