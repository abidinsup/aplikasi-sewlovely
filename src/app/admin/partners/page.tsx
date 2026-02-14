"use client";

import * as React from "react";
import { Users, Search, Ban, CheckCircle, AlertTriangle, Wallet, Trash2, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { getPartnersList, updatePartnerStatus, deletePartner, updatePartnerPassword } from "@/lib/commission";

export default function PartnerListPage() {
    const [partners, setPartners] = React.useState<any[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);

    // Modal State
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
    const [targetPartner, setTargetPartner] = React.useState<any>(null);
    const [selectedPartner, setSelectedPartner] = React.useState<any>(null);
    const [newPassword, setNewPassword] = React.useState("");
    const [actionType, setActionType] = React.useState<'Active' | 'Inactive' | 'Delete'>('Inactive');

    const loadPartners = async () => {
        setIsLoading(true);
        try {
            const result = await getPartnersList();
            if (result.success && result.data) {
                setPartners(result.data);
            } else {
                toast.error("Gagal memuat data mitra");
            }
        } catch (err) {
            console.error('Error loading partners:', err);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadPartners();
    }, []);

    const onActionClick = (partner: any, action: 'Active' | 'Inactive' | 'Delete') => {
        setTargetPartner(partner);
        setActionType(action);
        setIsConfirmOpen(true);
    };

    const onViewDetails = (partner: any) => {
        setSelectedPartner(partner);
        setIsDetailOpen(true);
    };

    const onResetPasswordClick = (partner: any) => {
        setTargetPartner(partner);
        setNewPassword("");
        setIsResetPasswordOpen(true);
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }

        if (!targetPartner?.originalId) {
            toast.error("Data mitra tidak valid");
            return;
        }

        setIsLoading(true);
        try {
            const result = await updatePartnerPassword(targetPartner.originalId, newPassword);
            if (result.success) {
                toast.success("Password berhasil diupdate");
                setIsResetPasswordOpen(false);
                setNewPassword("");
            } else {
                toast.error("Gagal update password", { description: result.error });
            }
        } catch (err) {
            toast.error("Gagal update password");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmAction = async () => {
        if (targetPartner) {
            if (actionType === 'Delete') {
                await handleDeletePartner(targetPartner.originalId);
            } else {
                await handleStatusUpdate(targetPartner.originalId, actionType);
            }
            setIsConfirmOpen(false);
            setTargetPartner(null);
        }
    };

    const handleDeletePartner = async (id: string) => {
        const result = await deletePartner(id);
        if (result.success) {
            toast.success("Data mitra berhasil dihapus permanen");
            loadPartners();
        } else {
            toast.error("Gagal menghapus data mitra", { description: result.error });
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'Active' | 'Inactive') => {
        const result = await updatePartnerStatus(id, newStatus);
        if (result.success) {
            toast.success(`Mitra berhasil di-${newStatus === 'Active' ? 'aktifkan' : 'nonaktifkan'}`);
            loadPartners();
        } else {
            toast.error("Gagal update status mitra", { description: result.error });
        }
    };

    const filteredPartners = partners.filter(p =>
        (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (p.id?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Data Mitra</h1>
                <p className="text-slate-500">Daftar semua mitra agen dan reseller Sewlovely</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-900 hidden md:block">List Mitra</h3>
                    <div className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari nama atau ID..."
                                className="!pl-10 bg-slate-50 border-slate-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="bg-[#63e5ff] text-slate-900 font-bold hover:bg-cyan-400 shadow-sm shadow-cyan-400/20">
                            Cari
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-lg">ID Mitra</th>
                                <th className="p-4">Nama Lengkap</th>
                                <th className="p-4">Tanggal Gabung</th>
                                <th className="p-4">Total Penjualan</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {isLoading && partners.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Memuat data mitra...</td></tr>
                            ) : filteredPartners.length > 0 ? (
                                filteredPartners.map((partner) => (
                                    <tr key={partner.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono text-xs text-slate-500">
                                            {(partner.originalId || "").substring(0, 8)}...
                                        </td>
                                        <td className="p-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => onViewDetails(partner)}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs group-hover:bg-blue-100 transition-colors">
                                                    {partner.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors underline-offset-4 group-hover:underline">
                                                    {partner.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600">{partner.joinDate}</td>
                                        <td className="p-4 font-bold text-emerald-600">Rp {partner.totalSales?.toLocaleString("id-ID") || 0}</td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-bold capitalize",
                                                partner.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            )}>
                                                {partner.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => onViewDetails(partner)}
                                                    title="Detail Mitra"
                                                >
                                                    <Users className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                                    onClick={() => onResetPasswordClick(partner)}
                                                    title="Reset Password"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </Button>

                                                {partner.status === 'Active' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => onActionClick(partner, 'Inactive')}
                                                        title="Nonaktifkan Mitra"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => onActionClick(partner, 'Active')}
                                                            title="Aktifkan Mitra"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => onActionClick(partner, 'Delete')}
                                                            title="Hapus Permanen"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                        Tidak ada data mitra ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={cn(
                            "flex items-center gap-2",
                            actionType === 'Active' ? 'text-emerald-600' : actionType === 'Delete' ? 'text-red-600' : 'text-slate-600'
                        )}>
                            {actionType === 'Active' ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : actionType === 'Delete' ? (
                                <Trash2 className="h-5 w-5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5" />
                            )}
                            {actionType === 'Delete' ? 'Hapus Mitra' :
                                `Konfirmasi ${actionType === 'Active' ? 'Aktifkan' : 'Nonaktifkan'}`}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'Delete' ? (
                                <>
                                    Apakah Anda yakin ingin menghapus data mitra <strong>{targetPartner?.name}</strong>?
                                    <br /><br />
                                    <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                        Perhatian: Data yang dihapus tidak dapat dikembalikan!
                                    </span>
                                </>
                            ) : (
                                <>
                                    Apakah Anda yakin ingin {actionType === 'Active' ? 'mengaktifkan kembali' : 'menonaktifkan'} mitra <strong>{targetPartner?.name}</strong>?
                                    <br /><br />
                                    {actionType === 'Active'
                                        ? "Mitra ini akan dapat mengakses akun mereka kembali."
                                        : "Mitra ini tidak akan dapat mengakses akun mereka sampai diaktifkan kembali."
                                    }
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant={actionType === 'Active' ? "default" : "destructive"}
                            className={cn(actionType === 'Active' ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                            onClick={confirmAction}
                        >
                            {actionType === 'Delete' ? 'Ya, Hapus Permanen' :
                                `Ya, ${actionType === 'Active' ? 'Aktifkan' : 'Nonaktifkan'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DETAIL DIALOG */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    Detail Mitra
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-bold capitalize ml-2",
                                        selectedPartner?.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    )}>
                                        {selectedPartner?.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    Bergabung sejak {selectedPartner?.joinDate}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedPartner && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-emerald-600" /> Informasi Pribadi
                                </h4>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold text-[10px]">Nama Lengkap</p>
                                        <p className="font-medium text-slate-900">{selectedPartner.name || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold text-[10px]">Email</p>
                                        <p className="font-medium text-slate-900">{selectedPartner.email || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold text-[10px]">No. WhatsApp</p>
                                        <p className="font-medium text-slate-900">{selectedPartner.phone || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold text-[10px]">Tanggal Lahir</p>
                                        <p className="font-medium text-slate-900">{selectedPartner.birthDate || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    Informasi Domisili
                                </h4>
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm h-full">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold text-[10px]">Alamat Lengkap</p>
                                        <p className="font-medium text-slate-900 leading-relaxed">{selectedPartner.address || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase font-bold text-[10px]">Kode Afiliasi</p>
                                        <div className="flex flex-col items-start gap-1 mt-1">
                                            <p className="font-mono font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                                                {selectedPartner.affiliateCode || '-'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                Komisi: <span className="text-emerald-600 font-bold">{selectedPartner.commissionPercentage || 5}%</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Info */}
                            <div className="space-y-4 md:col-span-2">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    Rekening Bank
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold">Nama Bank</p>
                                        <p className="font-medium text-slate-900">{selectedPartner.bankName || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold">No. Rekening</p>
                                        <p className="font-mono font-bold text-slate-900 text-lg">{selectedPartner.accountNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold">Atas Nama</p>
                                        <p className="font-medium text-slate-900">{selectedPartner.accountHolder || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Info */}
                            <div className="space-y-4 md:col-span-2">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-emerald-600" /> Informasi Keuangan & Komisi
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-emerald-600 text-[10px] uppercase font-bold tracking-wider mb-1">Total Komisi</p>
                                        <p className="font-bold text-lg text-emerald-900">
                                            Rp {(selectedPartner.totalCommission || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <p className="text-orange-600 text-[10px] uppercase font-bold tracking-wider mb-1">Sudah Ditarik</p>
                                        <p className="font-bold text-lg text-orange-900">
                                            Rp {(selectedPartner.totalWithdrawn || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-blue-600 text-[10px] uppercase font-bold tracking-wider mb-1">Saldo Saat Ini</p>
                                        <p className="font-bold text-lg text-blue-900">
                                            Rp {(selectedPartner.availableBalance || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Penarikan Pending</p>
                                        <p className="font-bold text-lg text-slate-700">
                                            Rp {(selectedPartner.pendingWithdrawal || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setIsDetailOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* RESET PASSWORD DIALOG */}
            <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <Key className="h-5 w-5" />
                            Ganti Password Mitra
                        </DialogTitle>
                        <DialogDescription>
                            Anda akan mengganti password untuk mitra <strong>{targetPartner?.name}</strong>.
                            Kirimkan password baru ini kepada mitra setelah berhasil diupdate.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Password Baru</label>
                            <Input
                                type="text"
                                placeholder="Masukkan password baru"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-12 border-slate-200"
                            />
                            <p className="text-[10px] text-slate-400">Minimal 6 karakter. Gunakan kombinasi huruf dan angka.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={handleResetPassword}
                            disabled={isLoading}
                        >
                            {isLoading ? "Memproses..." : "Update Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
