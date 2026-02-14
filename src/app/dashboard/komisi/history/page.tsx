"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, History, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Transaction {
    id: string;
    type: 'commission' | 'withdraw';
    amount: number;
    description: string;
    status: 'pending' | 'success' | 'failed';
    created_at: string;
}

export default function AllTransactionsPage() {
    const [partner, setPartner] = React.useState<Partner | null>(null);
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'commission' | 'withdraw'>('all');

    React.useEffect(() => {
        const currentPartner = getCurrentPartner();
        if (currentPartner) {
            setPartner(currentPartner);
            fetchTransactions(currentPartner.id);

            // 30-second auto refresh
            const intervalId = setInterval(() => {
                fetchTransactions(currentPartner.id);
            }, 30000);

            return () => clearInterval(intervalId);
        }
    }, []);

    const fetchTransactions = async (partnerId: string) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('partner_id', partnerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTransactions(data || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white px-4 sm:px-6 lg:px-8 pt-6 pb-8 rounded-b-[2rem] shadow-sm border-b border-slate-100">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/komisi">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-50 -ml-2">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
                            <p className="text-sm text-slate-500">Semua aktivitas komisi dan penarikan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
                {/* Filter Buttons */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            filter === 'all'
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300"
                        )}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => setFilter('commission')}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            filter === 'commission'
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                        )}
                    >
                        Komisi Masuk
                    </button>
                    <button
                        onClick={() => setFilter('withdraw')}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                            filter === 'withdraw'
                                ? "bg-orange-600 text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-orange-300"
                        )}
                    >
                        Penarikan
                    </button>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <History className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium">Belum ada transaksi</p>
                            <p className="text-sm text-slate-400">Transaksi akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredTransactions.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-5 p-5 hover:bg-slate-50 transition-colors">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                        item.type === 'withdraw'
                                            ? "bg-orange-100 text-orange-600"
                                            : "bg-blue-100 text-blue-600"
                                    )}>
                                        {item.type === 'withdraw' ? <Wallet className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate">
                                            {item.description || (item.type === 'withdraw' ? 'Penarikan Saldo' : 'Komisi')}
                                        </h4>
                                        <p className="text-sm text-slate-500">{formatDate(item.created_at)}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={cn(
                                            "block font-bold text-base",
                                            item.type === 'withdraw' ? "text-slate-900" : "text-emerald-600"
                                        )}>
                                            {item.type === 'withdraw' ? '-' : '+'} {formatCurrency(Number(item.amount))}
                                        </span>
                                        <span className={cn(
                                            "inline-block mt-1 capitalize font-semibold px-2.5 py-0.5 rounded-md text-[10px]",
                                            item.status === 'success'
                                                ? "bg-emerald-100 text-emerald-700"
                                                : item.status === 'pending'
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-red-100 text-red-700"
                                        )}>
                                            {item.status === 'success' ? 'Berhasil' : item.status === 'pending' ? 'Pending' : 'Gagal'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-6 text-center text-sm text-slate-500">
                    Menampilkan {filteredTransactions.length} transaksi
                </div>
            </div>
        </div>
    );
}
