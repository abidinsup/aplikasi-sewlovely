"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAppSettings } from "@/providers/AppSettingsProvider";

export default function RegisterSuccessPage() {
    const { appName } = useAppSettings();
    const [affiliateCode, setAffiliateCode] = useState("");
    const [partnerName, setPartnerName] = useState("");

    useEffect(() => {
        const code = localStorage.getItem('newPartnerCode') || '';
        const name = localStorage.getItem('newPartnerName') || '';
        setAffiliateCode(code);
        setPartnerName(name);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm fixed inset-0 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="bg-emerald-100 rounded-full p-4 h-20 w-20 flex items-center justify-center animate-bounce">
                        <div className="bg-emerald-500 rounded-full p-2">
                            <Check className="h-8 w-8 text-white stroke-[3]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900">Pendaftaran Mitra Berhasil</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Selamat bergabung sebagai mitra {appName}{partnerName ? `, ${partnerName}` : ''}!
                    </p>
                </div>

                {affiliateCode && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                        <p className="text-sm text-emerald-700 font-medium">Kode Afiliasi Anda:</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-emerald-600 tracking-wider">{affiliateCode}</span>
                        </div>
                    </div>
                )}

                <Link
                    href="/dashboard"
                    className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/30"
                >
                    Buka Dashboard
                </Link>
            </div>
        </div>
    );
}
