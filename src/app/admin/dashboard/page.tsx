"use client";

import * as React from "react";
import { Wallet, TrendingUp, Users, ArrowUpRight, ArrowRight, Download, FileSpreadsheet, ChevronDown, Calendar, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats } from "@/lib/commission";
import { toast } from "sonner";

export default function AdminDashboardPage() {
    const [stats, setStats] = React.useState({ totalOmset: 0, pendingWithdrawals: 0, totalMitra: 0 });
    const [recentTransactions, setRecentTransactions] = React.useState<any[]>([]);
    const [allInvoices, setAllInvoices] = React.useState<any[]>([]); // For Charts & Export
    const [allWithdrawals, setAllWithdrawals] = React.useState<any[]>([]); // For Export

    // Analytics State
    const [selectedMonth, setSelectedMonth] = React.useState<string>("");
    const [selectedEndMonth, setSelectedEndMonth] = React.useState<string>("");
    const [selectedYear, setSelectedYear] = React.useState<string>("");
    const [chartDataCurrent, setChartDataCurrent] = React.useState<any[]>([]);
    const [chartDataLast, setChartDataLast] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            const result = await getAdminDashboardStats();
            if (result.success && result.data) {
                setStats({
                    totalOmset: result.data.totalOmset,
                    pendingWithdrawals: result.data.pendingWithdrawals,
                    totalMitra: result.data.totalMitra
                });
                setRecentTransactions(result.data.recentTransactions);
                setAllInvoices(result.data.allInvoices);
                setAllWithdrawals(result.data.allWithdrawals || []);

                // Generate Chart Data
                setChartDataCurrent(generateChartData(result.data.allInvoices, "2026"));
                setChartDataLast(generateChartData(result.data.allInvoices, "2025"));
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper: Parse Indonesian Date "05 Februari 2026"
    const parseIndonesianDate = (dateStr: string) => {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const parts = dateStr.split(" ");
        if (parts.length < 3) return new Date(); // Fallback

        const day = parseInt(parts[0]);
        const monthIndex = months.indexOf(parts[1]);
        const year = parseInt(parts[2]);

        return new Date(year, monthIndex, day);
    };

    const generateChartData = (invoices: any[], year: string) => {
        const monthlyData = Array(12).fill(0);

        if (!invoices || !Array.isArray(invoices)) return monthlyData.map((_, index) => ({
            month: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][index],
            amount: 0,
            height: 1
        }));

        invoices.forEach(inv => {
            if (inv.status === 'paid' || inv.status === 'success') {
                let dateObj = new Date();
                if (inv.created_at) {
                    dateObj = new Date(inv.created_at);
                } else if (inv.date) {
                    dateObj = parseIndonesianDate(inv.date);
                }

                if (dateObj.getFullYear() === parseInt(year)) {
                    monthlyData[dateObj.getMonth()] += (inv.amount || 0);
                }
            }
        });

        // Normalize for chart height (max 100%)
        const maxVal = Math.max(...monthlyData, 1);
        return monthlyData.map((amount, index) => ({
            month: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][index],
            amount: amount,
            height: Math.round((amount / maxVal) * 100)
        }));
    };

    const downloadCSV = (type: 'sales' | 'withdrawals') => {
        if (!selectedMonth || !selectedYear) {
            toast.error("Mohon pilih Bulan Awal dan Tahun terlebih dahulu", {
                description: "Anda harus memilih periode laporan sebelum melakukan export."
            });
            return;
        }

        const startIdx = parseInt(selectedMonth) - 1;
        const endIdx = selectedEndMonth ? parseInt(selectedEndMonth) - 1 : startIdx;

        if (endIdx < startIdx) {
            toast.error("Rentang bulan tidak valid", {
                description: "Bulan akhir tidak boleh lebih awal dari bulan awal."
            });
            return;
        }

        let data = [];
        let filename = "";
        let header = "";

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const rangeName = startIdx === endIdx ? monthNames[startIdx] : `${monthNames[startIdx]}-${monthNames[endIdx]}`;

        if (type === 'sales') {
            const invoices = allInvoices;

            // Filter by Month Range & Year
            const filteredInvoices = invoices.filter((inv: any) => {
                let dateObj = new Date();
                if (inv.created_at) {
                    dateObj = new Date(inv.created_at);
                } else if (inv.date) {
                    dateObj = parseIndonesianDate(inv.date);
                }
                const m = dateObj.getMonth();
                const y = dateObj.getFullYear();
                return y === parseInt(selectedYear) && m >= startIdx && m <= endIdx;
            });

            filename = `laporan-penjualan-${rangeName}-${selectedYear}.csv`;
            header = "ID Invoice,Tanggal,Tipe,Customer,Mitra,Total Harga,Status\n";
            data = filteredInvoices.map((inv: any) =>
                `${inv.id},${inv.date},${inv.type},${inv.customer},${inv.mitraName},${inv.amount},${inv.status}`
            );
        } else {
            const withdrawals = allWithdrawals;

            // Filter by Month Range & Year
            const filteredWithdrawals = withdrawals.filter((wd: any) => {
                let dateObj = new Date();
                if (wd.created_at) {
                    dateObj = new Date(wd.created_at);
                } else if (wd.date) {
                    dateObj = parseIndonesianDate(wd.date);
                }
                const m = dateObj.getMonth();
                const y = dateObj.getFullYear();
                return y === parseInt(selectedYear) && m >= startIdx && m <= endIdx;
            });

            filename = `laporan-komisi-${rangeName}-${selectedYear}.csv`;
            header = "ID Request,Tanggal,Mitra,Bank,No Rekening,Jumlah,Status\n";
            data = filteredWithdrawals.map((wd: any) =>
                `${wd.id},${wd.date},${wd.mitraName},${wd.bank},${wd.accountNumber},${wd.amount},${wd.status}`
            );
        }

        if (data.length === 0) {
            toast.warning(`Tidak ada data untuk periode ${rangeName} ${selectedYear}`);
            return;
        }

        const csvContent = header + data.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Laporan ${type === 'sales' ? 'Penjualan' : 'Komisi'} berhasil diunduh`);
    };

    const renderChart = (title: string, data: any[], colorClass: string, barClass: string) => (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden flex-1">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                    <p className="text-sm text-slate-500">Omset per bulan</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
                    <span>Omset (Rp)</span>
                </div>
            </div>

            <div className="h-64 w-full flex items-end justify-between gap-2">
                {data.map((d, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {d.amount > 0 && (
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                Rp {d.amount.toLocaleString("id-ID")}
                            </div>
                        )}
                        <div
                            className={`w-full max-w-[30px] rounded-t-lg relative overflow-hidden transition-all duration-500 ${barClass}`}
                            style={{ height: `${d.height || 1}%` }} // Minimal 1% for visibility if 0
                        ></div>
                        <span className="text-[10px] text-slate-400 font-medium">{d.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 whitespace-nowrap">Dashboard</h1>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm border border-emerald-100">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">
                            Ringkasan performa bisnis <span className="text-slate-800 font-semibold">Sewlovely Homeset</span>
                        </p>
                    </div>
                </div>

                {/* TOOLBAR FOR EXPORT ONLY */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
                    <div className="hidden sm:flex items-center gap-2 px-3 pl-4 text-slate-400 border-r border-slate-100 mr-1 min-h-[40px]">
                        <Download className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Export</span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        {/* Start Month Filter */}
                        <div className="relative group flex-1 sm:flex-none">
                            <select
                                className="w-full sm:w-[130px] h-11 pl-4 pr-8 appearance-none bg-slate-50 hover:bg-slate-100 border-0 rounded-xl text-slate-700 font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all cursor-pointer"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="" disabled>Dari Bulan</option>
                                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* End Month Filter (Optional) */}
                        <div className="relative group flex-1 sm:flex-none">
                            <select
                                className="w-full sm:w-[130px] h-11 pl-4 pr-8 appearance-none bg-slate-50 hover:bg-slate-100 border-0 rounded-xl text-slate-700 font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all cursor-pointer"
                                value={selectedEndMonth}
                                onChange={(e) => setSelectedEndMonth(e.target.value)}
                            >
                                <option value="">Sampai (Opsional)</option>
                                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                                    <option key={i} value={i + 1} disabled={selectedMonth ? (i + 1) < parseInt(selectedMonth) : false}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Year Filter (For Export) */}
                        <div className="relative group flex-1 sm:flex-none">
                            <select
                                className="w-full sm:w-[100px] h-11 pl-4 pr-8 appearance-none bg-slate-50 hover:bg-slate-100 border-0 rounded-xl text-slate-700 font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all cursor-pointer"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="" disabled>Tahun</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="w-full sm:w-px h-px sm:h-8 bg-slate-100 mx-1"></div>

                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        <Button onClick={() => downloadCSV('sales')} className="flex-1 sm:flex-none h-11 gap-2 bg-[#63e5ff] hover:bg-cyan-400 text-slate-900 font-bold shadow-lg shadow-cyan-400/20 border-0">
                            <FileSpreadsheet className="h-4 w-4" /> <span>Export</span>
                        </Button>
                        <Button
                            onClick={() => downloadCSV('withdrawals')}
                            className="flex-1 sm:flex-none h-11 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 border-0"
                        >
                            <Download className="h-4 w-4" />
                            <span>Komisi</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1: Omset */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-24 w-24 text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Omset (Semua)</p>
                        <h3 className="text-2xl font-bold text-slate-900">Rp {stats.totalOmset.toLocaleString("id-ID")}</h3>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>Update Realtime</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Penarikan Pending */}
                <Link href="/admin/withdrawals">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors cursor-pointer h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wallet className="h-24 w-24 text-amber-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Permintaan Withdrawal</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.pendingWithdrawals} Request</h3>
                            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mt-2">
                                <span>Perlu persetujuan Anda</span>
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Card 3: Mitra */}
                <Link href="/admin/partners">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors cursor-pointer h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="h-24 w-24 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                                <Users className="h-6 w-6" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Mitra Aktif</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalMitra} Mitra</h3>
                            <div className="flex items-center gap-1 text-blue-600 text-xs font-bold mt-2">
                                <ArrowUpRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                <span>Terdaftar</span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* UNIFIED COMPARISON CHART */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Perbandingan Penjualan Tahunan</h3>
                        <p className="text-sm text-slate-500">Omset 2025 vs 2026</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-blue-500"></span>
                            <span className="text-slate-600">2025</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                            <span className="text-slate-600">2026</span>
                        </div>
                    </div>
                </div>

                <div className="h-72 w-full flex items-end justify-between gap-1 md:gap-4">
                    {Array.from({ length: 12 }).map((_, index) => {
                        const monthName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][index];
                        const dataLast = chartDataLast[index] || { amount: 0, height: 0 };
                        const dataCurr = chartDataCurrent[index] || { amount: 0, height: 0 };

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end pb-6">
                                {/* Hover Tooltip Container */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-2 px-3 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-xl border border-slate-700">
                                    <div className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1">{monthName}</div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-blue-400">2025:</span>
                                        <span>Rp {dataLast.amount.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-emerald-400">2026:</span>
                                        <span>Rp {dataCurr.amount.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <div className="flex items-end gap-[2px] md:gap-1 w-full justify-center h-full">
                                    {/* Bar 2025 (Last Year) */}
                                    <div
                                        className="w-1.5 md:w-4 bg-blue-200 rounded-t-sm md:rounded-t-md relative overflow-hidden transition-all duration-500 group-hover:bg-blue-300"
                                        style={{ height: `${dataLast.height || 1}%` }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-500" style={{ height: '100%' }}></div>
                                    </div>

                                    {/* Bar 2026 (Current Year) */}
                                    <div
                                        className="w-1.5 md:w-4 bg-emerald-200 rounded-t-sm md:rounded-t-md relative overflow-hidden transition-all duration-500 group-hover:bg-emerald-300"
                                        style={{ height: `${dataCurr.height || 1}%` }}
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 transition-all duration-500" style={{ height: '100%' }}></div>
                                    </div>
                                </div>

                                {/* X Axis Label */}
                                <span className="absolute bottom-0 text-[10px] md:text-xs text-slate-400 font-medium">{monthName}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity Table ... */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Transaksi Terbaru</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-lg">ID Invoice</th>
                                <th className="p-4">Mitra</th>
                                <th className="p-4">Tipe</th>
                                <th className="p-4">Total</th>
                                <th className="p-4 text-center rounded-tr-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {recentTransactions.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-900">{inv.id}</td>
                                    <td className="p-4 text-slate-600">{inv.mitraName || "-"}</td>
                                    <td className="p-4 text-slate-600 capitalize">{inv.type}</td>
                                    <td className="p-4 font-bold text-slate-900">Rp {(inv.amount || 0).toLocaleString("id-ID")}</td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold capitalize",
                                            inv.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                        )}>{inv.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
