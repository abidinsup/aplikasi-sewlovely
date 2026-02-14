"use client";

import * as React from "react";
import { Building2, Building, Grip, Activity, FileText, PlusCircle, AlertCircle, CheckCircle2, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import SurveyCalculatorGorden from "./SurveyCalculatorGorden";
import SurveyCalculatorKantor from "./SurveyCalculatorKantor";
import SurveyCalculatorRS from "./SurveyCalculatorRS";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SurveyCalculatorProps {
    survey: any;
}

export default function SurveyCalculator({ survey }: SurveyCalculatorProps) {
    const [selectedType, setSelectedType] = React.useState<"gorden" | "kantor" | "rs" | null>(null);
    const [invoices, setInvoices] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showCalculator, setShowCalculator] = React.useState(false);

    React.useEffect(() => {
        const fetchInvoices = async () => {
            if (!survey?.id) return;

            try {
                const { data, error } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('survey_id', survey.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setInvoices(data || []);
            } catch (err) {
                console.error("Error fetching invoices:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, [survey?.id]);

    if (selectedType === "gorden") {
        return <SurveyCalculatorGorden survey={survey} onBack={() => setSelectedType(null)} />;
    }

    if (selectedType === "kantor") {
        return <SurveyCalculatorKantor survey={survey} onBack={() => setSelectedType(null)} />;
    }

    if (selectedType === "rs") {
        return <SurveyCalculatorRS survey={survey} onBack={() => setSelectedType(null)} />;
    }

    // If loading, show skeleton or small loader
    if (isLoading) {
        return <div className="p-4 text-center text-slate-500 text-sm">Memuat data pesanan...</div>;
    }

    // If invoices exist and calculator is NOT forced open, show history
    if (invoices.length > 0 && !showCalculator) {
        return (
            <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 mt-0.5">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="text-sm text-emerald-800">
                        <p className="font-bold mb-1">Pesanan Sudah Dibuat</p>
                        <p className="opacity-90 leading-relaxed">
                            Hasil survey ini sudah memiliki {invoices.length} invoice.
                            Anda dapat melihat detailnya atau membuat pesanan tambahan jika diperlukan.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Riwayat Pesanan</h3>
                    {invoices.map((inv) => (
                        <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <FileText className="h-24 w-24 text-slate-900" />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                            inv.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {inv.payment_status === 'paid' ? 'Lunas' : 'Menunggu Bayar'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">{inv.invoice_number}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg">
                                        Rp {inv.total_amount.toLocaleString("id-ID")}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Dibuat pada {new Date(inv.created_at).toLocaleDateString("id-ID", {
                                            day: 'numeric', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/calculator/gorden/invoice?id=${inv.id}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Lihat Invoice
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowCalculator(true)}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors mx-auto"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Buat Pesanan Baru (Tambahan)
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Klik tombol di atas hanya jika Anda ingin membuat invoice tambahan berbeda dari yang sudah ada.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {showCalculator && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="text-sm text-amber-900">
                            <span className="font-bold">Mode Pembuatan Pesanan</span>
                            <p className="text-xs opacity-80">Anda sedang membuat invoice baru untuk survey ini.</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowCalculator(false)}>Batal</Button>
                </div>
            )}

            {!showCalculator && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-0.5">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">Pilih Jenis Kalkulator</p>
                        <p className="opacity-90 leading-relaxed">
                            Silakan pilih jenis kalkulator yang sesuai dengan hasil survey.
                            Data pemesan akan otomatis terisi berdasarkan data survey.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => setSelectedType("gorden")}
                    className="group relative bg-white hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-500 rounded-3xl p-6 transition-all duration-300 text-left hover:shadow-xl hover:shadow-emerald-900/5 group-hover:-translate-y-1"
                >
                    <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Building className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-emerald-700">Gorden Rumah</h3>
                        <p className="text-sm text-slate-500 group-hover:text-emerald-600/80 leading-relaxed">
                            Kalkulator untuk gorden atau vitrace rumah tinggal
                        </p>
                    </div>
                </button>

                <button
                    onClick={() => setSelectedType("kantor")}
                    className="group relative bg-white hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-500 rounded-3xl p-6 transition-all duration-300 text-left hover:shadow-xl hover:shadow-blue-900/5 group-hover:-translate-y-1"
                >
                    <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700">Gorden Kantor</h3>
                        <p className="text-sm text-slate-500 group-hover:text-blue-600/80 leading-relaxed">
                            Kalkulator untuk Roller, Vertical, atau Venetian Blind
                        </p>
                    </div>
                </button>

                <button
                    onClick={() => setSelectedType("rs")}
                    className="group relative bg-white hover:bg-red-50 border-2 border-slate-100 hover:border-red-500 rounded-3xl p-6 transition-all duration-300 text-left hover:shadow-xl hover:shadow-red-900/5 group-hover:-translate-y-1"
                >
                    <div className="h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Activity className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-red-700">Gorden RS</h3>
                        <p className="text-sm text-slate-500 group-hover:text-red-600/80 leading-relaxed">
                            Kalkulator untuk gorden anti darah & anti bakteri
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
