"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function WithdrawPage() {
    const router = useRouter();
    const [partner, setPartner] = React.useState<Partner | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [amount, setAmount] = React.useState("");
    const [balance, setBalance] = React.useState(0);
    const [withdrawAll, setWithdrawAll] = React.useState(false);

    React.useEffect(() => {
        const currentPartner = getCurrentPartner();
        if (currentPartner) {
            setPartner(currentPartner);
            fetchBalance(currentPartner.id);
        }
    }, []);

    const fetchBalance = async (partnerId: string) => {
        try {
            // Fetch ALL transactions (including pending)
            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount, status')
                .eq('partner_id', partnerId);

            if (error) throw error;

            let totalEarned = 0;
            let totalWithdrawn = 0;
            let pendingWithdrawal = 0;

            (data || []).forEach((tx: any) => {
                if (tx.type === 'commission' && tx.status === 'success') {
                    totalEarned += Number(tx.amount);
                } else if (tx.type === 'withdraw' && tx.status === 'success') {
                    totalWithdrawn += Number(tx.amount);
                } else if (tx.type === 'withdraw' && tx.status === 'pending') {
                    pendingWithdrawal += Number(tx.amount);
                }
            });

            // Available balance = earned - withdrawn - pending
            setBalance(totalEarned - totalWithdrawn - pendingWithdrawal);
        } catch (err) {
            console.error('Error fetching balance:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner) return;

        const withdrawAmount = parseInt(amount.replace(/\D/g, ''));

        // Validasi
        if (!withdrawAmount || withdrawAmount < 50000) {
            toast.error("Minimum penarikan Rp 50.000");
            return;
        }

        if (withdrawAmount > balance) {
            toast.error("Saldo tidak mencukupi", {
                description: `Saldo Anda: Rp ${balance.toLocaleString('id-ID')}`
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    partner_id: partner.id,
                    type: 'withdraw',
                    amount: withdrawAmount,
                    description: `Penarikan ke ${partner.bank_name} - ${partner.account_number}`,
                    status: 'pending',
                });

            if (error) throw error;

            toast.success("Pengajuan berhasil!", {
                description: "Menunggu persetujuan admin"
            });

            // Redirect ke status page
            router.push('/dashboard/komisi/withdraw/status?status=pending&amount=' + withdrawAmount);
        } catch (err: any) {
            toast.error("Gagal mengajukan penarikan", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: string) => {
        const number = value.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrency(e.target.value);
        setAmount(formatted);
    };

    // Toggle withdraw all handler
    const handleWithdrawAllToggle = () => {
        const newValue = !withdrawAll;
        setWithdrawAll(newValue);
        if (newValue) {
            setAmount(formatCurrency(balance.toString()));
        } else {
            setAmount("");
        }
    };

    if (!partner) {
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
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/komisi">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-50 -ml-2">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Tarik Saldo</h1>
                            <p className="text-sm text-slate-500">Ajukan penarikan ke rekening Anda</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-lg mx-auto px-4 sm:px-6 mt-8">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="h-5 w-5 text-emerald-200" />
                        <span className="text-emerald-100 text-sm font-medium">Saldo Tersedia</span>
                    </div>
                    <h2 className="text-4xl font-bold">Rp {balance.toLocaleString('id-ID')}</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Jumlah Penarikan</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">Rp</span>
                            <Input
                                value={amount}
                                onChange={handleAmountChange}
                                className="h-16 pl-12 text-2xl font-bold rounded-2xl border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-400">Minimum penarikan Rp 50.000</p>
                    </div>

                    {/* Toggle Tarik Semua */}
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                        <div className="flex-1">
                            <p className="font-bold text-emerald-800 text-base">Tarik Semua Saldo</p>
                            <p className="text-sm text-emerald-600 mt-0.5">Tarik Rp {balance.toLocaleString('id-ID')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleWithdrawAllToggle}
                            className={cn(
                                "relative w-16 h-9 rounded-full transition-all duration-300 flex-shrink-0 ml-4",
                                withdrawAll
                                    ? "bg-emerald-600 shadow-inner shadow-emerald-700/30"
                                    : "bg-slate-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300",
                                    withdrawAll ? "left-8" : "left-1"
                                )}
                            />
                        </button>
                    </div>

                    {/* Bank Info */}
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                        <p className="text-sm font-bold text-slate-700">Rekening Tujuan</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                                <span className="font-bold text-slate-600 text-xs">{partner.bank_name?.slice(0, 3)}</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{partner.bank_name}</p>
                                <p className="text-sm text-slate-500 font-mono">{partner.account_number}</p>
                                <p className="text-xs text-slate-400">a.n. {partner.account_holder}</p>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            Pengajuan penarikan akan diproses dalam waktu <span className="font-bold">1-2 hari kerja</span> setelah disetujui admin.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading || !amount}
                        className={cn(
                            "w-full h-14 text-lg font-bold rounded-2xl transition-all",
                            "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
                            "text-white shadow-lg shadow-emerald-600/20",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isLoading ? "Memproses..." : "Ajukan Penarikan"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
