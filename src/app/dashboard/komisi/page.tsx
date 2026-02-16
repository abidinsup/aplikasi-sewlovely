"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, History, ArrowUpRight, ArrowDownLeft, ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Transaction {
    id: string;
    type: 'commission' | 'withdraw';
    amount: number;
    description: string;
    status: 'pending' | 'success' | 'rejected' | 'failed';
    created_at: string;
    proof_url?: string;
}

export default function CommissionPage() {
    const [partner, setPartner] = React.useState<Partner | null>(null);
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [stats, setStats] = React.useState({
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
    });
    const [selectedProof, setSelectedProof] = React.useState<{ url: string | null; loading: boolean }>({ url: null, loading: false });

    const fetchTransactions = async (partnerId: string, isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            // Fetch ALL transactions for accurate balance calculation
            const { data: allData, error: allError } = await supabase
                .from('transactions')
                .select('type, amount, status')
                .eq('partner_id', partnerId);

            if (allError) throw allError;

            // Calculate stats from ALL transactions
            let totalEarned = 0;
            let totalWithdrawn = 0;
            let pendingWithdrawal = 0;

            (allData || []).forEach((tx: any) => {
                if (tx.type === 'commission' && tx.status === 'success') {
                    totalEarned += Number(tx.amount);
                } else if (tx.type === 'withdraw' && tx.status === 'success') {
                    totalWithdrawn += Number(tx.amount);
                } else if (tx.type === 'withdraw' && tx.status === 'pending') {
                    pendingWithdrawal += Number(tx.amount);
                }
            });

            setStats({
                balance: totalEarned - totalWithdrawn - pendingWithdrawal,
                totalEarned,
                totalWithdrawn,
                pendingWithdrawal,
            });

            // Fetch recent 10 transactions for display
            const { data: recentData, error: recentError } = await supabase
                .from('transactions')
                .select('*')
                .eq('partner_id', partnerId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (recentError) throw recentError;

            setTransactions(recentData || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce realtime updates
    const debouncedFetch = React.useRef<NodeJS.Timeout>();
    const handleRealtimeChange = (id: string) => {
        if (debouncedFetch.current) clearTimeout(debouncedFetch.current);
        debouncedFetch.current = setTimeout(() => {
            fetchTransactions(id);
        }, 1200); // Slightly different debounce to offset simultaneous hits
    }

    React.useEffect(() => {
        const currentPartner = getCurrentPartner();
        if (!currentPartner) {
            setIsLoading(false);
            return;
        }

        const setup = async () => {
            // Fetch latest profile to ensure bank/name info is fresh
            const { data: profile } = await supabase
                .from('partners')
                .select('*')
                .eq('id', currentPartner.id)
                .single();

            if (profile) {
                setPartner(profile);
            } else {
                setPartner(currentPartner);
            }

            fetchTransactions(currentPartner.id, true);
        };

        setup();

        // Subscribe to realtime changes for transactions
        const channel = supabase
            .channel(`partner-commissions-${currentPartner.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `partner_id=eq.${currentPartner.id}`
                },
                () => handleRealtimeChange(currentPartner.id)
            )
            .subscribe();

        return () => {
            if (debouncedFetch.current) clearTimeout(debouncedFetch.current);
            supabase.removeChannel(channel);
        };
    }, []);

    const handleViewProof = async (path: string) => {
        setSelectedProof({ url: null, loading: true });
        try {
            const { data, error } = await supabase.storage
                .from('payment-proofs')
                .createSignedUrl(path, 300);

            if (error) throw error;
            setSelectedProof({ url: data.signedUrl, loading: false });
        } catch (err) {
            console.error('Error viewing proof:', err);
            setSelectedProof({ url: null, loading: false });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header (Desktop Optimized) */}
            <div className="bg-white px-4 sm:px-6 lg:px-8 pt-6 pb-8 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-50 -ml-2 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Komisi & Saldo</h1>
                            <p className="text-sm text-slate-500 hidden md:block">Kelola pendapatan dan penarikan saldo Anda</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container (Desktop Optimized) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN (Balance & Quick Actions) - Spans 8 cols on Large Screens */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Balance Card - Ultra Premium Gradient */}
                        <div className="transform transition-all duration-500 hover:scale-[1.01]">
                            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
                                {/* Dynamic Background Shapes */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/15 transition-all duration-1000"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                                <div className="absolute top-1/2 left-1/2 w-full h-full bg-gradient-to-t from-black/20 to-transparent opacity-60 pointer-events-none"></div>

                                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-4">
                                            <p className="text-emerald-50 text-xs font-medium flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                                <Wallet className="h-3.5 w-3.5" />
                                                Saldo Aktif
                                            </p>
                                            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
                                        </div>

                                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-200 drop-shadow-sm">
                                            Rp {stats.balance.toLocaleString('id-ID')}
                                        </h2>

                                        {/* Pending Withdrawal Info */}
                                        {stats.pendingWithdrawal > 0 && (
                                            <div className="mt-3 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                                                <span className="text-amber-100 text-xs font-medium">
                                                    Rp {stats.pendingWithdrawal.toLocaleString('id-ID')} sedang diproses
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto min-w-[160px]">
                                        <Link href="/dashboard/komisi/withdraw" className="flex-1 md:flex-none w-full">
                                            <Button className="w-full h-12 px-6 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-base border-0 shadow-lg shadow-black/10 rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]">
                                                Tarik Saldo
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions (Desktop View - Expanded Table) */}
                        <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-900">Riwayat Transaksi</h3>
                                        <p className="text-sm text-slate-500">Aktivitas pemasukan dan penarikan terbaru</p>
                                    </div>
                                </div>
                                <Link href="/dashboard/komisi/history" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all">
                                    Lihat Semua Riwayat
                                </Link>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Belum ada transaksi</p>
                                    <p className="text-sm text-slate-400">Transaksi komisi dan penarikan akan muncul di sini</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {transactions.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-6 p-5 bg-slate-50/50 border border-slate-100 hover:border-emerald-200 rounded-[1.5rem] transition-all cursor-pointer group hover:bg-white hover:shadow-md">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                                                item.type === 'withdraw'
                                                    ? "bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white"
                                                    : "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                                            )}>
                                                {item.type === 'withdraw' ? <Wallet className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div className="md:col-span-2">
                                                    <h4 className="font-bold text-lg text-slate-900 truncate">{item.description || (item.type === 'withdraw' ? 'Penarikan Saldo' : 'Komisi')}</h4>
                                                    <p className="text-sm text-slate-500 mt-0.5">{formatDate(item.created_at)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "block font-bold text-lg",
                                                        item.type === 'withdraw' ? "text-slate-900" : "text-emerald-600"
                                                    )}>
                                                        {item.type === 'withdraw' ? '-' : '+'} {formatCurrency(Number(item.amount))}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-block mt-1 capitalize font-semibold px-2.5 py-0.5 rounded-md text-[10px] tracking-wide",
                                                        item.status === 'success' ? "bg-emerald-100 text-emerald-700" :
                                                            item.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                    )}>{item.status === 'success' ? 'Berhasil' : item.status === 'rejected' ? 'Ditolak' : 'Pending'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                {item.proof_url && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleViewProof(item.proof_url!);
                                                        }}
                                                        className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold hover:bg-emerald-100 whitespace-nowrap"
                                                    >
                                                        Lihat Bukti
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Stats & Mobile History) - Spans 4 cols on Large Screens */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Stats Row - Stacked Vertically on Desktop */}
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-5">
                            <div className="bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center gap-4 transition-all hover:shadow-md hover:border-blue-100 hover:-translate-y-1 group cursor-default">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                    <ArrowDownLeft className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Pendapatan</p>
                                    <p className="font-bold text-3xl text-slate-900 tracking-tight">{formatCurrency(stats.totalEarned)}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center gap-4 transition-all hover:shadow-md hover:border-orange-100 hover:-translate-y-1 group cursor-default">
                                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                    <ArrowUpRight className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Ditarik</p>
                                    <p className="font-bold text-3xl text-slate-900 tracking-tight">{formatCurrency(stats.totalWithdrawn)}</p>
                                </div>
                            </div>
                        </div>

                        {/* History List (Mobile/Tablet View Only) */}
                        <div className="lg:hidden space-y-6">
                            <div className="flex items-end justify-between px-2">
                                <h3 className="font-bold text-xl text-slate-900">Riwayat Transaksi</h3>
                                <Link href="/dashboard/komisi/history" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors hover:bg-emerald-100">
                                    Lihat Semua
                                </Link>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                                    <p className="text-slate-500">Belum ada transaksi</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-5 p-5 bg-white border border-slate-100 hover:border-emerald-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-x-1">
                                            <div className={cn(
                                                "w-14 h-14 rounded-[1.2rem] flex items-center justify-center shrink-0 transition-all shadow-inner",
                                                item.type === 'withdraw'
                                                    ? "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
                                                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                                            )}>
                                                {item.type === 'withdraw' ? <Wallet className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <h4 className="font-bold text-base text-slate-900 truncate pr-2 group-hover:text-emerald-700 transition-colors">{item.description || (item.type === 'withdraw' ? 'Penarikan' : 'Komisi')}</h4>
                                                    <span className={cn(
                                                        "font-extrabold text-sm whitespace-nowrap",
                                                        item.type === 'withdraw' ? "text-slate-900" : "text-emerald-600"
                                                    )}>
                                                        {item.type === 'withdraw' ? '-' : '+'} {formatCurrency(Number(item.amount))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-400 font-medium">{formatDate(item.created_at)}</span>
                                                    <span className={cn(
                                                        "capitalize font-bold px-2.5 py-1 rounded-lg text-[10px] tracking-wide",
                                                        item.status === 'success' ? "bg-emerald-100 text-emerald-700" :
                                                            item.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                    )}>{item.status === 'success' ? 'Berhasil' : item.status === 'rejected' ? 'Ditolak' : 'Pending'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Proof Modal */}
            {selectedProof.loading || selectedProof.url ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Bukti Transfer Penarikan</h3>
                            <button
                                onClick={() => setSelectedProof({ url: null, loading: false })}
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedProof.loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3">
                                    <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full"></div>
                                    <p className="text-sm font-medium text-slate-500">Memuat bukti transfer...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                        <img
                                            src={selectedProof.url!}
                                            alt="Bukti Transfer"
                                            className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                                        />
                                    </div>
                                    <a
                                        href={selectedProof.url!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center h-12 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        Buka Full Image
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
