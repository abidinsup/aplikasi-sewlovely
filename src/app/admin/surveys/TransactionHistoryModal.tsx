"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, FileText, Calendar, Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    surveyId: string | null;
}

export default function TransactionHistoryModal({ isOpen, onClose, surveyId }: TransactionHistoryModalProps) {
    const router = useRouter();
    const [invoices, setInvoices] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && surveyId) {
            fetchInvoices(surveyId);
        }
    }, [isOpen, surveyId]);

    const fetchInvoices = async (id: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('survey_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (err: any) {
            console.error("Error fetching invoices:", err);
            toast.error("Gagal memuat riwayat transaksi");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Riwayat Transaksi</h3>
                            <p className="text-xs text-slate-500">Daftar invoice terkait survey ini</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200/50 -mr-2">
                        <X className="h-5 w-5 text-slate-400" />
                    </Button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                            <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
                            <span className="text-sm font-medium">Memuat data...</span>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-slate-300" />
                            </div>
                            <h4 className="font-bold text-slate-700 mb-1">Belum Ada Transaksi</h4>
                            <p className="text-sm max-w-[200px]">Survey ini belum memiliki invoice penjualan yang dibuat.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>

                                    <div className="flex justify-between items-start mb-4 pl-3">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm tracking-tight">{inv.invoice_number}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-500">
                                                    {new Date(inv.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                            inv.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                                inv.payment_status === 'pending' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                                    "bg-red-100 text-red-700 border border-red-200"
                                        )}>
                                            {inv.payment_status === 'paid' ? 'Lunas' : inv.payment_status === 'pending' ? 'Belum Bayar' : inv.payment_status}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 pl-3">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tagihan</div>
                                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-lg">
                                            <span className="text-xs font-normal text-slate-400 mt-1">Rp</span>
                                            {Number(inv.total_amount).toLocaleString('id-ID')}
                                        </div>
                                    </div>

                                    {inv.commission_paid && (
                                        <div className="mt-3 bg-blue-50 rounded-xl p-2.5 flex items-center gap-2 text-xs font-medium text-blue-700 border border-blue-100 ml-3">
                                            <Wallet className="h-3.5 w-3.5" />
                                            Komisi Sudah Dicairkan
                                        </div>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full mt-4 gap-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                                        onClick={() => {
                                            const type = inv.invoice_type || 'gorden';
                                            router.push(`/admin/calculator/${type}/invoice?id=${inv.id}`);
                                        }}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Lihat Invoice
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                    <Button onClick={onClose} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6 h-11 font-medium shadow-lg shadow-slate-900/10">
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}
