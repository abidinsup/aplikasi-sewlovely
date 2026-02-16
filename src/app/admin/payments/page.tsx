"use client";

import * as React from "react";
import { CheckCircle, XCircle, Clock, Eye, Search, FileText, Banknote, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCommissionPercentage, saveCommissionTransaction } from "@/lib/commission";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Invoice {
    id: string;
    invoice_number: string;
    partner_id: string;
    customer_name: string;
    customer_phone: string;
    invoice_type: string;
    total_amount: number;
    payment_status: 'pending' | 'paid' | 'cancelled';
    payment_proof_url: string | null;
    customer_address?: string;
    details?: any;
    created_at: string;
    survey_id?: string;
    partners?: { full_name: string; affiliate_code: string };
}

export default function AdminPaymentsPage() {
    const router = useRouter();
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'pending' | 'paid' | 'cancelled'>('pending');
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
    const [showApproveDialog, setShowApproveDialog] = React.useState(false);
    const [showRejectDialog, setShowRejectDialog] = React.useState(false);
    const [isApproving, setIsApproving] = React.useState(false);
    const [isRejecting, setIsRejecting] = React.useState(false);
    const [commissionPercentage, setCommissionPercentage] = React.useState(5);
    const [proofImageUrl, setProofImageUrl] = React.useState<string | null>(null);
    const [isLoadingProof, setIsLoadingProof] = React.useState(false);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);

    React.useEffect(() => {
        fetchInvoices();
        fetchCommissionPercentage();

        // 30-second auto refresh
        const intervalId = setInterval(() => {
            fetchInvoices();
        }, 30000);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    const fetchCommissionPercentage = async () => {
        const percentage = await getCommissionPercentage();
        setCommissionPercentage(percentage);
    };

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('invoices')
                .select(`
                    *,
                    partners (full_name, affiliate_code)
                `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('payment_status', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;
            setInvoices(data || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Get signed URL for payment proof (private bucket)
    const getPaymentProofUrl = async (filePath: string) => {
        if (!filePath || filePath.startsWith('local-upload')) return null;

        try {
            const { data, error } = await supabase.storage
                .from('payment-proofs')
                .createSignedUrl(filePath, 300); // 5 minutes expiry

            if (error) throw error;
            return data.signedUrl;
        } catch (err) {
            console.error('Error getting signed URL:', err);
            return null;
        }
    };

    const handleApprove = async () => {
        if (!selectedInvoice) return;
        setIsApproving(true);

        try {
            // 1. Upload Proof if selected
            let proofUrl = selectedInvoice.payment_proof_url;

            if (uploadFile) {
                const fileExt = uploadFile.name.split('.').pop();
                const fileName = `proof_${selectedInvoice.id}_${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('payment-proofs')
                    .upload(fileName, uploadFile, { upsert: true });

                if (uploadError) throw uploadError;

                // For private buckets, we store the path. For public, the URL.
                // Assuming 'payment-proofs' is public readable based on previous context.
                // If it was private, we'd just store `fileName`
                // Let's store the path relative to bucket for consistency
                proofUrl = fileName;
            } else if (!proofUrl) {
                toast.error("Mohon upload bukti transfer");
                setIsApproving(false);
                return;
            }

            // 1. Update invoice status to paid and save proof URL
            const { error: updateError } = await supabase
                .from('invoices')
                .update({
                    payment_status: 'paid',
                    paid_at: new Date().toISOString(),
                    approved_by: 'owner',
                    commission_paid: false, // Commission is NOT paid yet
                    payment_proof_url: proofUrl,
                })
                .eq('id', selectedInvoice.id);

            if (updateError) throw updateError;


            // 3. Automate Survey Status Update -> Installation
            // If the invoice is linked to a survey, update the survey status to 'installation'
            if (selectedInvoice.survey_id) {
                const { error: surveyError } = await supabase
                    .from('survey_schedules')
                    .update({
                        status: 'installation',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedInvoice.survey_id);

                if (surveyError) {
                    console.error('Error auto-updating survey status:', surveyError);
                    toast.error("Gagal update status survey otomatis");
                } else {
                    toast.success("Status Survey diperbarui ke 'Proses Pemasangan'");
                }
            }

            toast.success("Pembayaran Disetujui!", {
                description: selectedInvoice.partner_id
                    ? "Pembayaran dikonfirmasi. Komisi akan cair setelah pemasangan selesai."
                    : "Invoice telah ditandai sebagai lunas"
            });

            setShowApproveDialog(false);
            setSelectedInvoice(null);
            await fetchInvoices();
            router.refresh();
        } catch (err: any) {
            toast.error("Gagal menyetujui pembayaran", { description: err.message });
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!selectedInvoice) return;
        setIsRejecting(true);
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ payment_status: 'cancelled' })
                .eq('id', selectedInvoice.id);

            if (error) throw error;

            toast.success("Pembayaran Ditolak");
            setShowRejectDialog(false);
            setSelectedInvoice(null);
            await fetchInvoices();
            router.refresh();
        } catch (err: any) {
            toast.error("Gagal menolak pembayaran", { description: err.message });
        } finally {
            setIsRejecting(false);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            gorden: 'Gorden',
            kantor: 'Office Blind',
            rs: 'Hospital',
            sprei: 'Sprei',
            bedcover: 'Bedcover'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Approval Pembayaran</h1>
                <p className="text-slate-500">Verifikasi pembayaran dan cairkan komisi mitra</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-amber-800">
                            {invoices.filter(i => i.payment_status === 'pending').length}
                        </p>
                        <p className="text-sm text-amber-600">Menunggu Approval</p>
                    </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-800">
                            {invoices.filter(i => i.payment_status === 'paid').length}
                        </p>
                        <p className="text-sm text-emerald-600">Sudah Disetujui</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-xl text-red-600">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-800">
                            {invoices.filter(i => i.payment_status === 'cancelled').length}
                        </p>
                        <p className="text-sm text-red-600">Pembayaran Ditolak</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari invoice atau nama customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex-1 w-full overflow-x-auto scrollbar-hide">
                    <div className="bg-slate-100 p-1 rounded-xl flex w-fit min-w-full">
                        <Button
                            variant={filterStatus === 'pending' ? "default" : "ghost"}
                            onClick={() => setFilterStatus('pending')}
                            className={cn(
                                "rounded-lg px-4 h-9 text-xs sm:text-sm font-bold transition-all flex-shrink-0",
                                filterStatus === 'pending' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"
                            )}
                        >
                            Menunggu Approval
                        </Button>
                        <Button
                            variant={filterStatus === 'paid' ? "default" : "ghost"}
                            onClick={() => setFilterStatus('paid')}
                            className={cn(
                                "rounded-lg px-4 h-9 text-xs sm:text-sm font-bold transition-all flex-shrink-0",
                                filterStatus === 'paid' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"
                            )}
                        >
                            History Lunas
                        </Button>
                        <Button
                            variant={filterStatus === 'cancelled' ? "default" : "ghost"}
                            onClick={() => setFilterStatus('cancelled')}
                            className={cn(
                                "rounded-lg px-4 h-9 text-xs sm:text-sm font-bold transition-all flex-shrink-0",
                                filterStatus === 'cancelled' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-transparent"
                            )}
                        >
                            History Penolakan
                        </Button>
                    </div>
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Tidak ada invoice ditemukan</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredInvoices.map((invoice) => (
                            <div key={invoice.id} className="group transition-colors">
                                {/* Desktop Layout */}
                                <div className="hidden md:flex p-6 items-center justify-between gap-4 hover:bg-slate-50">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            invoice.payment_status === 'pending' ? "bg-amber-100 text-amber-600" :
                                                invoice.payment_status === 'paid' ? "bg-emerald-100 text-emerald-600" :
                                                    "bg-red-100 text-red-600"
                                        )}>
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900">{invoice.invoice_number}</h3>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                    {getTypeLabel(invoice.invoice_type)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium">{invoice.customer_name}</p>
                                            <p className="text-xs text-slate-400">{formatDate(invoice.created_at)}</p>
                                            {invoice.partners && (
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    Mitra: {invoice.partners.full_name} ({invoice.partners.affiliate_code})
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-slate-900">
                                                Rp {invoice.total_amount.toLocaleString('id-ID')}
                                            </p>
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-xs font-bold uppercase",
                                                invoice.payment_status === 'pending' ? "bg-amber-100 text-amber-700" :
                                                    invoice.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                                                        "bg-red-100 text-red-700"
                                            )}>
                                                {invoice.payment_status === 'pending' ? 'Menunggu' :
                                                    invoice.payment_status === 'paid' ? 'Lunas' : 'Ditolak'}
                                            </span>
                                        </div>

                                        {invoice.payment_status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={async () => {
                                                        setSelectedInvoice(invoice);
                                                        setShowApproveDialog(true);
                                                        if (invoice.payment_proof_url) {
                                                            setIsLoadingProof(true);
                                                            const url = await getPaymentProofUrl(invoice.payment_proof_url);
                                                            setProofImageUrl(url);
                                                            setIsLoadingProof(false);
                                                        } else {
                                                            setProofImageUrl(null);
                                                        }
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={async () => {
                                                        setSelectedInvoice(invoice);
                                                        setShowRejectDialog(true);
                                                        if (invoice.payment_proof_url) {
                                                            setIsLoadingProof(true);
                                                            const url = await getPaymentProofUrl(invoice.payment_proof_url);
                                                            setProofImageUrl(url);
                                                            setIsLoadingProof(false);
                                                        } else {
                                                            setProofImageUrl(null);
                                                        }
                                                    }}
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Card Layout */}
                                <div className="md:hidden p-4 space-y-3 bg-white" onClick={async () => {
                                    if (invoice.payment_status === 'pending') {
                                        setSelectedInvoice(invoice);
                                        setShowApproveDialog(true);
                                        if (invoice.payment_proof_url) {
                                            setIsLoadingProof(true);
                                            const url = await getPaymentProofUrl(invoice.payment_proof_url);
                                            setProofImageUrl(url);
                                            setIsLoadingProof(false);
                                        } else {
                                            setProofImageUrl(null);
                                        }
                                    }
                                }}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{invoice.invoice_number}</p>
                                            <h4 className="font-extrabold text-slate-900 leading-tight">{invoice.customer_name}</h4>
                                            <p className="text-[11px] font-semibold text-blue-600">Rp {invoice.total_amount.toLocaleString('id-ID')}</p>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase",
                                            invoice.payment_status === 'pending' ? "bg-amber-100 text-amber-700" :
                                                invoice.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                                                    "bg-red-100 text-red-700"
                                        )}>
                                            {invoice.payment_status === 'pending' ? 'Pending' :
                                                invoice.payment_status === 'paid' ? 'Lunas' : 'Ditolak'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-medium">{formatDate(invoice.created_at)}</span>
                                            {invoice.partners && (
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                                                    Mitra: {invoice.partners.full_name}
                                                </span>
                                            )}
                                        </div>
                                        {invoice.payment_status === 'pending' && (
                                            <Button size="sm" className="h-8 bg-emerald-600 text-white text-[10px] font-bold px-4 rounded-lg">
                                                Review
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approve Dialog */}
            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Tolak Pembayaran?</DialogTitle>
                        <DialogDescription>
                            Anda akan <span className="text-red-600 font-bold uppercase">menolak</span> pembayaran untuk invoice <span className="font-bold">{selectedInvoice?.invoice_number}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-4">
                            {/* Detailed Info Preview */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-slate-500">Customer</div>
                                        <div className="font-medium text-slate-900">{selectedInvoice.customer_name}</div>
                                        <div className="text-slate-500">Tipe</div>
                                        <div className="font-medium text-slate-900 capitalize">{getTypeLabel(selectedInvoice.invoice_type)}</div>
                                        <div className="text-slate-500 text-red-600">Total Tagihan</div>
                                        <div className="font-bold text-red-600">Rp {selectedInvoice.total_amount.toLocaleString('id-ID')}</div>
                                    </div>

                                    {selectedInvoice.details && (
                                        <div className="border-t border-slate-200 pt-2 mt-1 text-xs text-slate-500 italic">
                                            {selectedInvoice.invoice_type === 'gorden' && `Model: ${selectedInvoice.details.model}, Kain: ${selectedInvoice.details.fabric}`}
                                            {selectedInvoice.invoice_type === 'sprei' && `Pilihan: ${selectedInvoice.details.selectedSprei?.label || '-'}${selectedInvoice.details.selectedBedcover ? ' + Bedcover' : ''}`}
                                            {selectedInvoice.invoice_type === 'kantor' && `Blind: ${selectedInvoice.details.blindType?.toUpperCase()}`}
                                            {selectedInvoice.invoice_type === 'rs' && `Kain: ${selectedInvoice.details.fabricType}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Proof Section */}
                            {selectedInvoice?.payment_proof_url && (
                                <div className="border border-red-100 bg-red-50/30 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3" /> Bukti Pembayaran Yang Ditolak:
                                    </p>
                                    {isLoadingProof ? (
                                        <div className="h-20 bg-white/50 rounded-lg flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                        </div>
                                    ) : proofImageUrl ? (
                                        <img
                                            src={proofImageUrl}
                                            alt="Bukti Ditolak"
                                            className="w-full max-h-32 object-contain rounded-lg border border-red-100"
                                        />
                                    ) : (
                                        <div className="text-xs text-slate-400">Gambar tidak tersedia</div>
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200">
                                <strong>Catatan:</strong> Penolakan akan membatalkan status invoice ini. Mitra harus mengunggah bukti pembayaran yang valid kembali.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={isRejecting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isRejecting ? "Memproses..." : "Ya, Tolak Pembayaran"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Pembayaran?</DialogTitle>
                        <DialogDescription>
                            Anda akan menyetujui pembayaran untuk invoice <span className="font-bold">{selectedInvoice?.invoice_number}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-4">
                            {/* Order Details Preview */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" /> Detail Pesanan
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-slate-500">Invoice:</span> <span className="font-bold">{selectedInvoice.invoice_number}</span></p>
                                    <p><span className="text-slate-500">Total:</span> <span className="font-bold text-emerald-600">Rp {selectedInvoice.total_amount.toLocaleString('id-ID')}</span></p>
                                    <p><span className="text-slate-500">Customer:</span> {selectedInvoice.customer_name}</p>
                                </div>
                            </div>

                            {/* Payment Proof Upload Section - Only if not already present */}
                            {!selectedInvoice.payment_proof_url && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Upload Bukti Transfer (Wajib)</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="payment-proof-upload"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setUploadFile(file);
                                            }}
                                        />
                                        {uploadFile ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-emerald-600 font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                                                <button onClick={() => setUploadFile(null)} className="text-red-500 hover:text-red-600">
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="payment-proof-upload" className="cursor-pointer text-center">
                                                <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                <span className="text-sm text-blue-600 font-medium hover:underline">Pilih Gambar</span>
                                                <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG</p>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedInvoice.payment_proof_url && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
                                    <CheckCircle className="h-4 w-4" /> Bukti transfer sudah ada
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowApproveDialog(false);
                            setUploadFile(null);
                        }}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isApproving || (!selectedInvoice?.payment_proof_url && !uploadFile)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            {isApproving ? "Memproses..." : "Ya, Setujui"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
