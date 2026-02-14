"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Clock, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { supabase } from "@/lib/supabase";
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from "@/lib/commission";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WithdrawalApprovalPage() {
    const router = useRouter();
    const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
    const [filter, setFilter] = React.useState<'pending' | 'success' | 'rejected'>('pending');
    const [selectedDate, setSelectedDate] = React.useState<string>("");
    const [selectedBank, setSelectedBank] = React.useState<string>("");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [appliedSearchQuery, setAppliedSearchQuery] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        const result = await getWithdrawals();
        if (result.success) {
            // Map Supabase data to UI format
            const mapped = (result.data || []).map((w: any) => ({
                id: w.id,
                mitra: w.partners?.full_name || "Unknown",
                mitraId: w.partners?.affiliate_code || "-",
                amount: w.amount,
                bank: w.partners?.bank_name || "-",
                accountNumber: w.partners?.account_number || "-",
                date: new Date(w.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }),
                rawDate: new Date(w.created_at), // For filtering
                status: w.status, // 'pending', 'success', 'rejected'
                proof_url: w.proof_url
            }));
            setWithdrawals(mapped);
        } else {
            toast.error("Gagal mengambil data penarikan");
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchData();

        // 30-second auto refresh
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [proofImageUrl, setProofImageUrl] = React.useState<string | null>(null);
    const [isLoadingProof, setIsLoadingProof] = React.useState(false);

    const onActionClick = async (id: string, type: 'approve' | 'reject') => {
        setSelectedId(id);
        setActionType(type);
        setSelectedFile(null);
        setUploadPreview(null);
        setConfirmOpen(true);

        // If it's a success item, load the proof
        const item = withdrawals.find(w => w.id === id);
        if (item?.proof_url) {
            setIsLoadingProof(true);
            const { data, error } = await supabase.storage
                .from('payment-proofs')
                .createSignedUrl(item.proof_url, 300);

            if (!error && data) {
                setProofImageUrl(data.signedUrl);
            } else {
                console.error("Error fetching signed URL:", error);
                toast.error("Gagal memuat bukti transfer.");
            }
            setIsLoadingProof(false);
        } else {
            setProofImageUrl(null);
        }
    };

    const confirmAction = async () => {
        if (!selectedId || !actionType) return;
        setIsProcessing(true);

        try {
            if (actionType === 'approve') {
                let proofUrl = "";

                // Handle File Upload if exists
                if (selectedFile) {
                    const fileExt = selectedFile.name.split('.').pop();
                    const fileName = `withdrawals/${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('payment-proofs')
                        .upload(fileName, selectedFile);

                    if (uploadError) throw uploadError;
                    proofUrl = fileName;
                }

                await toast.promise(approveWithdrawal(selectedId, proofUrl), {
                    loading: 'Memproses Approval...',
                    success: () => {
                        return 'Penarikan Disetujui! Saldo mitra akan dipotong.';
                    },
                    error: (err) => err.message || 'Gagal memproses approval'
                });
            } else {
                await toast.promise(rejectWithdrawal(selectedId), {
                    loading: 'Memproses Penolakan...',
                    success: () => {
                        return 'Penarikan ditolak.';
                    },
                    error: (err) => err.message || 'Gagal menolak penarikan'
                });
            }
            await fetchData(); // Refresh local state
            router.refresh(); // Invalidate Next.js cache
        } catch (err: any) {
            console.error("Action error:", err);
            toast.error(err.message || "Terjadi kesalahan");
        } finally {
            setIsProcessing(false);
            setConfirmOpen(false);
            setSelectedId(null);
            setActionType(null);
            setSelectedFile(null);
            setUploadPreview(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSearch = () => {
        setAppliedSearchQuery(searchQuery);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Filter Data
    const uniqueBanks = Array.from(new Set(withdrawals.map(item => item.bank))).filter(Boolean);

    const filteredData = withdrawals.filter((item) => {
        const matchesStatus = item.status === filter;

        const matchesDate = selectedDate ? item.date.includes(selectedDate) : true; // Simple string match for DD MMM YYYY
        // Note: Ideally compare actual Date objects, but item.date is formatted string.
        // For better filtering, we should store raw date in item and format in render.
        // Let's rely on mapped raw date if possible, or just string match for now as item.date is "DD MMM YYYY".

        const matchesBank = selectedBank ? item.bank === selectedBank : true;

        const searchLower = appliedSearchQuery.toLowerCase();
        const matchesSearch =
            item.mitra.toLowerCase().includes(searchLower) ||
            item.mitraId.toLowerCase().includes(searchLower) ||
            item.id.toLowerCase().includes(searchLower);

        return matchesStatus && matchesDate && matchesBank && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Approval Penarikan</h1>
                    <p className="text-slate-500">Kelola permintaan pencairan komisi mitra</p>
                </div>
                {/*                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Status Tabs */}
                    <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                        <button
                            onClick={() => setFilter('pending')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                filter === 'pending' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Menunggu Approval
                        </button>
                        <button
                            onClick={async () => {
                                setFilter('success');
                                await fetchData();
                            }}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                filter === 'success' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            History Transfer
                        </button>
                        <button
                            onClick={async () => {
                                setFilter('rejected');
                                await fetchData();
                            }}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                filter === 'rejected' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            History Penolakan
                        </button>
                    </div>

                    {/* Additional Filters */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <input
                            type="date"
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                        />
                        <select
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[120px]"
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                        >
                            <option value="">Semua Bank</option>
                            {uniqueBanks.map((bank: any, idx) => (
                                <option key={idx} value={bank}>{bank}</option>
                            ))}
                        </select>
                        {(selectedDate || selectedBank) && (
                            <button
                                onClick={() => { setSelectedDate(""); setSelectedBank(""); }}
                                className="text-sm text-red-500 hover:underline px-2"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari mitra atau ID..."
                            className="pl-9 bg-slate-50 border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <Button
                        onClick={handleSearch}
                        className="bg-[#63e5ff] hover:bg-cyan-400 text-slate-900 px-6 rounded-xl h-10 font-bold shadow-lg shadow-cyan-400/20 border-0"
                    >
                        Cari
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-lg">ID & Tanggal</th>
                                <th className="p-4">Mitra</th>
                                <th className="p-4">Bank & No. Rek</th>
                                <th className="p-4">Nominal</th>
                                <th className="p-4 text-center rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredData.length > 0 ? filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 group">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-900 truncate max-w-[100px]" title={item.id}>{item.id.slice(0, 8)}...</p>
                                        <p className="text-slate-500 text-xs">{item.date}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-700">{item.mitra}</p>
                                        <p className="text-slate-400 text-xs">{item.mitraId}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{item.bank}</span>
                                            <span className="text-slate-600 font-mono">{item.accountNumber}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-900 text-lg">
                                        Rp {item.amount.toLocaleString("id-ID")}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.status === 'pending' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Button size="sm" onClick={() => onActionClick(item.id, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 rounded-lg">
                                                    <CheckCircle2 className="h-4 w-4" /> Approve
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => onActionClick(item.id, 'reject')} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    item.status === 'success' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {item.status === 'success' ? 'Berhasil' : 'Ditolak'}
                                                </span>
                                                {item.proof_url && (
                                                    <button
                                                        onClick={() => onActionClick(item.id, 'approve')}
                                                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                                                    >
                                                        Lihat Bukti
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        {isLoading ? "Memuat data..." : "Tidak ada data penarikan."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${actionType === 'approve' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {actionType === 'approve' ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5" />
                            )}
                            {filter === 'pending' ? `Konfirmasi ${actionType === 'approve' ? 'Persetujuan' : 'Penolakan'}` : 'Detail Penarikan'}
                        </DialogTitle>
                        <DialogDescription>
                            {filter === 'pending'
                                ? (actionType === 'approve'
                                    ? "Apakah Anda yakin ingin menyetujui penarikan ini? Dana akan segera ditransfer ke rekening mitra."
                                    : "Apakah Anda yakin ingin menolak permintaan ini? Mitra akan menerima notifikasi penolakan.")
                                : "Detail penarikan dan bukti transfer."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {/* Approval Proof Upload */}
                    {filter === 'pending' && actionType === 'approve' && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-sm font-bold text-slate-700 mb-2 block">
                                    Upload Bukti Transfer (Opsional)
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {!uploadPreview ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-dashed border-2 h-24 rounded-xl text-slate-400 flex flex-col gap-1"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="h-6 w-6" />
                                        <span className="text-xs">Klik untuk pilih gambar</span>
                                    </Button>
                                ) : (
                                    <div className="relative group">
                                        <img
                                            src={uploadPreview}
                                            alt="Preview"
                                            className="w-full h-32 object-cover rounded-xl border border-slate-200"
                                        />
                                        <button
                                            onClick={() => { setSelectedFile(null); setUploadPreview(null); }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 mt-2 italic">
                                    * Bukti transfer akan mempercepat proses konfirmasi mitra.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* View Proof if success */}
                    {filter === 'success' && (
                        <div className="py-4">
                            {isLoadingProof ? (
                                <div className="h-40 bg-slate-50 flex items-center justify-center rounded-xl animate-pulse">
                                    <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full"></div>
                                </div>
                            ) : proofImageUrl ? (
                                <div className="space-y-2 text-center">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bukti Transfer</p>
                                    <img
                                        src={proofImageUrl}
                                        alt="Bukti Transfer"
                                        className="w-full max-h-64 object-contain rounded-xl border border-slate-100 bg-white"
                                    />
                                    <a
                                        href={proofImageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-xs font-bold text-emerald-600 hover:underline mt-2"
                                    >
                                        Buka Gambar Full Size
                                    </a>
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-50 text-center rounded-xl border border-dashed border-slate-200">
                                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Bukti transfer tidak diunggah saat approval.</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isProcessing}>Batal</Button>
                        {filter === 'pending' && (
                            <Button
                                disabled={isProcessing}
                                className={actionType === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                                onClick={confirmAction}
                            >
                                {isProcessing ? "Memproses..." : `Ya, ${actionType === 'approve' ? 'Setujui' : 'Tolak'}`}
                            </Button>
                        )}
                        {filter !== 'pending' && (
                            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Tutup</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
