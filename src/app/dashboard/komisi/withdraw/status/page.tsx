"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, CheckCircle2, ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { getCurrentPartner, Partner } from "@/lib/auth";

function WithdrawalStatusContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status") === "success" ? "success" : "pending";
    const amount = parseInt(searchParams.get("amount") || "0");
    const [partner, setPartner] = React.useState<Partner | null>(null);

    React.useEffect(() => {
        const currentPartner = getCurrentPartner();
        setPartner(currentPartner);
    }, []);

    const today = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-lg text-center relative overflow-hidden">

                {/* Decoration Circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-slate-50 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-slate-50 rounded-full translate-x-1/2 translate-y-1/2 opacity-50"></div>

                {/* Status Icon */}
                <div className="mb-6 relative inline-block">
                    <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center mb-4 mx-auto border-[6px]",
                        status === 'pending'
                            ? "bg-white border-amber-50 text-amber-500"
                            : "bg-emerald-50 border-emerald-100 text-emerald-500"
                    )}>
                        {status === 'pending' ? (
                            <Clock className="w-10 h-10" strokeWidth={2.5} />
                        ) : (
                            <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                        )}
                    </div>
                    <div className={cn(
                        "absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                        status === 'pending'
                            ? "bg-amber-500 text-white border-amber-400"
                            : "bg-emerald-500 text-white border-emerald-400"
                    )}>
                        {status === 'pending' ? 'Proses' : 'Berhasil'}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2 mb-8 animate-in slide-in-from-bottom-5 duration-500 fade-in">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {status === 'pending' ? 'Penarikan Diajukan' : 'Penarikan Berhasil'}
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                        {status === 'pending'
                            ? "Permintaan penarikan saldo Anda sedang menunggu persetujuan admin. Dana akan masuk ke rekening dalam waktu maksimal 2x24 jam kerja."
                            : "Dana penarikan saldo Anda telah berhasil ditransfer ke rekening tujuan."
                        }
                    </p>
                </div>

                {/* Details Card */}
                <div className="bg-slate-50 rounded-3xl p-6 space-y-4 text-left border border-slate-100 mb-8 w-full">
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 border-dashed pb-3">
                        <span className="text-slate-500">Jumlah Penarikan</span>
                        <span className="font-bold text-slate-900 text-lg">Rp {amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tanggal Penarikan</span>
                        <span className="font-bold text-slate-900">{today}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Bank Tujuan</span>
                        <span className="font-bold text-slate-900">
                            {partner ? `${partner.bank_name} - ${partner.account_number}` : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2">
                        <span className="text-slate-500">Status</span>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                            {status === 'pending' ? (
                                <>
                                    <Clock className="w-3 h-3" />
                                    Menunggu Approval
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Transfer Sukses
                                </>
                            )}
                        </div>
                    </div>
                </div>


                <Link href="/dashboard/komisi">
                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all duration-300 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Komisi
                    </Button>
                </Link>

            </div>
        </div>
    );
}

export default function WithdrawalStatusPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Memuat data...</div>}>
            <WithdrawalStatusContent />
        </React.Suspense>
    );
}
