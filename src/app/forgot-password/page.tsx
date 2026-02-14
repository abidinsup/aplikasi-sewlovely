"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { AuthLayout } from "@/components/ui/auth-layout";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
    const handleWhatsAppAdmin = () => {
        const adminWA = "6285159588681";
        const message = `Admin tolong reset kata sandi`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${adminWA}?text=${encodedMessage}`, '_blank');
    };

    return (
        <AuthLayout
            title="Lupa Kata Sandi?"
            subtitle="Hubungi Admin untuk reset kata sandi Anda."
            icon={<Logo />}
        >
            <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                    <p className="text-emerald-800 text-sm leading-relaxed">
                        Untuk keamanan akun, silakan hubungi Admin melalui WhatsApp untuk melakukan reset kata sandi.
                    </p>
                </div>

                <Button
                    onClick={handleWhatsAppAdmin}
                    className="w-full h-14 text-base font-bold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 rounded-xl"
                >
                    <MessageCircle className="h-6 w-6" />
                    Hubungi Admin via WhatsApp
                </Button>

                <div className="pt-2">
                    <Link
                        href="/login"
                        className="flex items-center justify-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
