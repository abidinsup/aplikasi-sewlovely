"use client";

import * as React from "react";
import { Check, X, Phone, CreditCard, User, AlertCircle, Users, BadgeCheck, Eye, MapPin, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
    getPartnerRequests,
    approvePartnerRequest,
    rejectPartnerRequest,
    getPendingPartners,
    approveNewPartner,
    updatePartnerStatus
} from "@/lib/commission";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PartnerApprovalsPage() {
    const [activeTab, setActiveTab] = React.useState<'data-changes' | 'new-registrations'>('data-changes');
    const [requests, setRequests] = React.useState<any[]>([]);
    const [pendingPartners, setPendingPartners] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<any | null>(null);
    const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);

    // Details Modal State
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [selectedPartnerDetails, setSelectedPartnerDetails] = React.useState<any | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'data-changes') {
                const result = await getPartnerRequests();
                if (result.success && result.data) {
                    setRequests(result.data.map((req: any) => ({
                        id: req.id,
                        date: new Date(req.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }),
                        partnerName: req.partners?.full_name || "Unknown",
                        partnerCode: req.partners?.affiliate_code || "-",
                        partnerId: req.partner_id,
                        type: req.type,
                        oldData: formatData(req.type, req.old_data),
                        newData: formatData(req.type, req.new_data),
                        rawNewData: req.new_data,
                        status: req.status
                    })));
                } else {
                    toast.error("Gagal mengambil data request");
                }
            } else {
                const result = await getPendingPartners();
                if (result.success && result.data) {
                    setPendingPartners(result.data.map((p: any) => ({
                        id: p.id,
                        date: new Date(p.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }),
                        name: p.full_name,
                        email: p.email,
                        phone: p.whatsapp_number,
                        address: p.address,
                        birthDate: p.birth_date ? new Date(p.birth_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : "-",
                        bank: p.bank_name,
                        accountNumber: p.account_number,
                        accountHolder: p.account_holder,
                        fullBankInfo: `${p.bank_name} - ${p.account_number} (${p.account_holder})`,
                        status: p.status
                    })));
                } else {
                    toast.error("Gagal mengambil data pendaftaran baru");
                }
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const formatData = (type: string, data: string) => {
        if (!data) return "-";
        if (type === 'phone') return data;
        if (type === 'bank') {
            try {
                const parsed = JSON.parse(data);
                return `${parsed.bank_name} ${parsed.account_number} a.n ${parsed.account_holder}`;
            } catch (e) {
                return data;
            }
        }
        return data;
    };

    const onActionClick = (item: any, type: 'approve' | 'reject') => {
        setSelectedItem(item);
        setActionType(type);
        setConfirmOpen(true);
    };

    const onViewDetails = (partner: any) => {
        setSelectedPartnerDetails(partner);
        setDetailsOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedItem || !actionType) return;

        if (activeTab === 'data-changes') {
            if (actionType === 'approve') {
                const result = await approvePartnerRequest(
                    selectedItem.id,
                    selectedItem.partnerId,
                    selectedItem.type,
                    selectedItem.rawNewData
                );
                if (result.success) {
                    toast.success("Perubahan data disetujui");
                    fetchData();
                } else {
                    toast.error("Gagal menyetujui request", { description: result.error });
                }
            } else {
                const result = await rejectPartnerRequest(selectedItem.id);
                if (result.success) {
                    toast.info("Perubahan data ditolak");
                    fetchData();
                } else {
                    toast.error("Gagal menolak request", { description: result.error });
                }
            }
        } else {
            // New partner registration
            if (actionType === 'approve') {
                const result = await approveNewPartner(selectedItem.id);
                if (result.success) {
                    toast.success("Mitra baru berhasil disetujui dan diaktifkan!");
                    fetchData();
                } else {
                    toast.error("Gagal menyetujui mitra baru", { description: result.error });
                }
            } else {
                // Reject pendaftaran baru (set to Inactive or delete?)
                // User only mentioned approval, let's set to Inactive for now
                const result = await updatePartnerStatus(selectedItem.id, 'Inactive');
                if (result.success) {
                    toast.info("Pendaftaran mitra ditolak (Nonaktif)");
                    fetchData();
                } else {
                    toast.error("Gagal menolak pendaftaran", { description: result.error });
                }
            }
        }
        setConfirmOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Approval Data Mitra</h1>
                    <p className="text-slate-500">Tinjau dan setujui pendaftaran baru atau perubahan data mitra.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                    <button
                        onClick={() => setActiveTab('data-changes')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'data-changes'
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Perubahan Data
                    </button>
                    <button
                        onClick={() => setActiveTab('new-registrations')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'new-registrations'
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Pendaftaran Baru
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'data-changes' ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-500">Tanggal</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Mitra</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Jenis Perubahan</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Perubahan</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
                                ) : requests.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada permintaan perubahan data.</td></tr>
                                ) : requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{req.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{req.partnerName}</div>
                                            <div className="text-xs text-slate-400 font-mono">{req.partnerCode}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg",
                                                    req.type === 'bank' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                                )}>
                                                    {req.type === 'bank' ? <CreditCard className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                                                </div>
                                                <span className="font-medium text-slate-700 capitalize">
                                                    {req.type === 'bank' ? 'Rekening Bank' : 'No. WhatsApp'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-red-500 text-xs line-through opacity-60">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {req.oldData}
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                                                    <Check className="h-3 w-3" />
                                                    {req.newData}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onActionClick(req, 'reject')}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onActionClick(req, 'approve')}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 w-8 p-0 rounded-lg shadow-sm shadow-emerald-600/20"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className={cn(
                                                    "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                                                    req.status === 'approved'
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-red-100 text-red-700"
                                                )}>
                                                    {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-500">Tanggal Daftar</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">Nama & Email</th>
                                    <th className="px-6 py-4 font-bold text-slate-500">No. WhatsApp</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
                                ) : pendingPartners.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada pendaftaran mitra baru.</td></tr>
                                ) : pendingPartners.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{p.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{p.name}</div>
                                            <div className="text-xs text-slate-400">{p.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">{p.phone}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onViewDetails(p)}
                                                    className="text-slate-500 hover:text-[#00CEC8] hover:bg-cyan-50 h-8 w-8 p-0 rounded-lg"
                                                    title="Lihat Detail Identitas"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onActionClick(p, 'reject')}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                                                    title="Tolak Pendaftaran"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => onActionClick(p, 'approve')}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 w-8 p-0 rounded-lg shadow-sm shadow-emerald-600/20"
                                                    title="Setujui & Aktifkan Login"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* IDENTITY DETAILS DIALOG */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <User className="h-5 w-5 text-[#00CEC8]" />
                            Identitas Calon Mitra
                        </DialogTitle>
                        <DialogDescription>
                            Berikut adalah data lengkap pendaftaran mitra baru untuk Anda tinjau.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPartnerDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                                    <p className="text-slate-900 font-bold">{selectedPartnerDetails.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                    <p className="text-slate-600 font-medium">{selectedPartnerDetails.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">No. WhatsApp</label>
                                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                                        <Phone className="h-4 w-4 text-emerald-500" />
                                        {selectedPartnerDetails.phone}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Lahir</label>
                                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                                        <CalendarDays className="h-4 w-4 text-blue-500" />
                                        {selectedPartnerDetails.birthDate}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</label>
                                    <div className="flex gap-2 text-slate-600 text-sm italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                        {selectedPartnerDetails.address || "Tidak ada alamat"}
                                    </div>
                                </div>
                                <div className="space-y-1 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <CreditCard className="h-3 w-3" />
                                        Informasi Pencairan Komisi
                                    </label>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-purple-600">Bank</span>
                                            <span className="text-sm font-bold text-purple-900">{selectedPartnerDetails.bank}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-purple-600">No. Rekening</span>
                                            <span className="text-sm font-bold text-purple-900 font-mono">{selectedPartnerDetails.accountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-purple-600">Nama Pemilik</span>
                                            <span className="text-sm font-bold text-purple-900">{selectedPartnerDetails.accountHolder}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-row justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                        <Button variant="outline" onClick={() => setDetailsOpen(false)}>Tutup</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={() => {
                                setDetailsOpen(false);
                                onActionClick(selectedPartnerDetails, 'approve');
                            }}
                        >
                            <Check className="h-4 w-4" />
                            Setujui Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={cn(
                            "flex items-center gap-2",
                            actionType === 'approve' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {activeTab === 'new-registrations' ? (
                                <Users className="h-5 w-5" />
                            ) : (
                                <CreditCard className="h-5 w-5" />
                            )}
                            Konfirmasi {actionType === 'approve' ? 'Persetujuan' : 'Penolakan'}
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === 'new-registrations' ? (
                                actionType === 'approve'
                                    ? `Apakah Anda yakin ingin menyetujui pendaftaran mitra ${selectedItem?.name}? Ini akan otomatis mengaktifkan akun login mereka.`
                                    : `Apakah Anda yakin ingin menolak pendaftaran mitra ${selectedItem?.name}? Mitra tidak akan bisa login sampai statusnya diubah menjadi Aktif.`
                            ) : (
                                actionType === 'approve'
                                    ? "Apakah Anda yakin ingin menyetujui perubahan data ini? Data mitra akan diperbarui secara otomatis."
                                    : "Apakah Anda yakin ingin menolak perubahan data ini? Mitra akan diminta untuk mengajukan ulang jika diperlukan."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
                        <Button
                            className={actionType === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                            onClick={confirmAction}
                        >
                            Ya, {actionType === 'approve'
                                ? (activeTab === 'new-registrations' ? 'Setujui & Aktifkan' : 'Setujui')
                                : 'Tolak'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
