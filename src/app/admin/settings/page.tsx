"use client";

import * as React from "react";
import { Upload, Save, Percent, Gift, Settings, Landmark, LayoutTemplate, Palette, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
    const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);
    const [showCleanupConfirm, setShowCleanupConfirm] = React.useState(false);
    const [isCleaning, setIsCleaning] = React.useState(false);
    const [commissionPercentage, setCommissionPercentage] = React.useState("5");
    const [bankName, setBankName] = React.useState("BCA");
    const [bankAccountNumber, setBankAccountNumber] = React.useState("8830-123-456");
    const [bankAccountHolder, setBankAccountHolder] = React.useState("SEWLOVELY HOMESET");
    const [sliderBadge, setSliderBadge] = React.useState("Info Mitra");
    const [sliderTitle, setSliderTitle] = React.useState("Raih Bonusnya! Selesaikan 5 Pemasangan");
    const [sliderDescription, setSliderDescription] = React.useState("Selesaikan 5 pemasangan minggu ini dan dapatkan bonus komisi tambahan");
    const [sliderHighlight, setSliderHighlight] = React.useState("Rp 300.000");
    const [isLoading, setIsLoading] = React.useState(false);

    // Dispatch event helper
    const triggerSettingsUpdate = () => {
        const event = new CustomEvent('app-settings-updated');
        window.dispatchEvent(event);
    };

    // Fetch current settings
    React.useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('key, value');

            if (data) {
                const commission = data.find(item => item.key === 'commission_percentage');
                if (commission) setCommissionPercentage(commission.value);

                const bank = data.find(item => item.key === 'bank_name');
                if (bank) setBankName(bank.value);

                const account = data.find(item => item.key === 'bank_account_number');
                if (account) setBankAccountNumber(account.value);

                const holder = data.find(item => item.key === 'bank_account_holder');
                if (holder) setBankAccountHolder(holder.value);

                const sBadge = data.find(item => item.key === 'slider_badge');
                if (sBadge) setSliderBadge(sBadge.value);

                const sTitle = data.find(item => item.key === 'slider_title');
                if (sTitle) setSliderTitle(sTitle.value);

                const sDesc = data.find(item => item.key === 'slider_description');
                if (sDesc) setSliderDescription(sDesc.value);

                const sHigh = data.find(item => item.key === 'slider_highlight');
                if (sHigh) setSliderHighlight(sHigh.value);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const handleCleanup = async () => {
        setIsCleaning(true);
        setShowCleanupConfirm(false);
        try {
            const response = await fetch('/api/admin/cleanup-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ retentionMonths: 2 })
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Foto Lama Berhasil Dihapus", {
                    description: result.message
                });
            } else {
                toast.error("Gagal menghapus foto", {
                    description: result.error || "Terjadi kesalahan pada server"
                });
            }
        } catch (error) {
            console.error("Cleanup error:", error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsCleaning(false);
        }
    };

    const handleSave = async () => {
        setShowSaveConfirm(false);
        setIsLoading(true);

        try {
            // Update commission percentage
            const { error: commissionError } = await supabase
                .from('app_settings')
                .update({
                    value: commissionPercentage,
                    updated_at: new Date().toISOString()
                })
                .eq('key', 'commission_percentage');

            if (commissionError) throw commissionError;

            // Update bank settings
            const bankUpdates = [
                { key: 'bank_name', value: bankName },
                { key: 'bank_account_number', value: bankAccountNumber },
                { key: 'bank_account_holder', value: bankAccountHolder },
                { key: 'slider_badge', value: sliderBadge },
                { key: 'slider_title', value: sliderTitle },
                { key: 'slider_description', value: sliderDescription },
                { key: 'slider_highlight', value: sliderHighlight },
            ];

            for (const update of bankUpdates) {
                const { error } = await supabase
                    .from('app_settings')
                    .update({ value: update.value, updated_at: new Date().toISOString() })
                    .eq('key', update.key);
                if (error) throw error;
            }

            triggerSettingsUpdate();

            toast.success("Pengaturan Disimpan", {
                description: `Semua pengaturan berhasil diperbarui`
            });
        } catch (err: any) {
            toast.error("Gagal menyimpan", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
                <p className="text-slate-500">Konfigurasi aplikasi dan sistem komisi</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pengaturan Umum */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-slate-100 rounded-xl">
                            <Settings className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Pengaturan Umum</h3>
                            <p className="text-sm text-slate-500">Nama aplikasi</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Nama Aplikasi</label>
                            <Input defaultValue="Sewlovely Homeset" className="max-w-md" />
                        </div>
                    </div>
                </div>

                {/* Pengaturan Komisi */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Percent className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Pengaturan Komisi</h3>
                            <p className="text-sm text-slate-500">Atur persentase komisi mitra</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="font-bold text-slate-700">Persentase Komisi Mitra</label>
                            <div className="flex items-center gap-3 max-w-xs">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={commissionPercentage}
                                    onChange={(e) => setCommissionPercentage(e.target.value)}
                                    className="text-2xl font-bold text-center h-14"
                                />
                                <span className="text-2xl font-bold text-slate-400">%</span>
                            </div>
                            <p className="text-sm text-slate-500">
                                Mitra akan mendapatkan <span className="font-bold text-emerald-600">{commissionPercentage}%</span> dari setiap invoice yang terbayar
                            </p>
                        </div>

                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                            <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                <Gift className="h-4 w-4" />
                                Contoh Perhitungan
                            </h4>
                            <p className="text-sm text-emerald-700">
                                Invoice: <span className="font-bold">Rp 1.000.000</span><br />
                                Komisi Mitra ({commissionPercentage}%): <span className="font-bold">Rp {(1000000 * parseInt(commissionPercentage || "0") / 100).toLocaleString('id-ID')}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pengaturan Rekening Bank */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Landmark className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Rekening Bank Transfer</h3>
                            <p className="text-sm text-slate-500">Data rekening yang akan muncul di semua invoice</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Nama Bank</label>
                            <Input
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="BCA"
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Nomor Rekening</label>
                            <Input
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="8830-123-456"
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Nama Pemilik Rekening</label>
                            <Input
                                value={bankAccountHolder}
                                onChange={(e) => setBankAccountHolder(e.target.value)}
                                placeholder="SEWLOVELY HOMESET"
                                className="h-12"
                            />
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 rounded-2xl p-5 border border-blue-100">
                        <p className="text-sm text-blue-700">
                            <span className="font-bold">Preview Invoice:</span><br />
                            Metode Pembayaran: Transfer ke <span className="font-bold">{bankName}</span> - <span className="font-bold">{bankAccountNumber}</span> a.n. <span className="font-bold">{bankAccountHolder}</span>
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <LayoutTemplate className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Banner Dashboard</h3>
                            <p className="text-sm text-slate-500">Atur konten banner promosi di halaman dashboard mitra</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="font-bold text-slate-700">Label Badge</label>
                                <Input
                                    value={sliderBadge}
                                    onChange={(e) => setSliderBadge(e.target.value)}
                                    placeholder="Contoh: Info Mitra"
                                    className="h-10"
                                />
                                <p className="text-xs text-slate-400">Label kecil di pojok kiri atas banner</p>
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold text-slate-700">Judul Utama</label>
                                <Input
                                    value={sliderTitle}
                                    onChange={(e) => setSliderTitle(e.target.value)}
                                    placeholder="Contoh: Raih Bonusnya!"
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="font-bold text-slate-700">Deskripsi</label>
                                <Input
                                    value={sliderDescription}
                                    onChange={(e) => setSliderDescription(e.target.value)}
                                    placeholder="Deskripsi singkat..."
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold text-slate-700">Teks Highlight (Kuning)</label>
                                <Input
                                    value={sliderHighlight}
                                    onChange={(e) => setSliderHighlight(e.target.value)}
                                    placeholder="Contoh: Rp 300.000"
                                    className="h-10"
                                />
                                <p className="text-xs text-slate-400">Teks yang akan di-highlight dengan warna kuning</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-emerald-900 rounded-2xl p-6 text-white overflow-hidden relative">
                        <div className="relative z-10 space-y-2 max-w-[90%]">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase border border-emerald-500/30">
                                {sliderBadge || 'BADGE'}
                            </span>
                            <h3 className="text-2xl font-bold leading-tight">
                                {sliderTitle || 'Judul Banner'}
                            </h3>
                            <p className="text-emerald-100/90 text-sm mt-2">
                                {sliderDescription || 'Deskripsi banner...'} <span className="font-bold text-yellow-300">{sliderHighlight}</span>
                            </p>
                        </div>
                        <div className="absolute right-0 top-0 opacity-10">
                            <Settings className="w-32 h-32" />
                        </div>
                    </div>
                </div>

            </div>

            {/* Manajemen Penyimpanan */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-rose-100 rounded-xl">
                        <Trash2 className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Manajemen Penyimpanan</h3>
                        <p className="text-sm text-slate-500">Hapus file lama untuk menghemat kuota penyimpanan</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between bg-rose-50 p-6 rounded-xl border border-rose-100 gap-6">
                    <div>
                        <h4 className="font-bold text-rose-900 mb-2">Hapus Foto Lama ({'>'} 2 Bulan)</h4>
                        <p className="text-sm text-rose-700 max-w-2xl leading-relaxed">
                            Fitur ini akan menghapus foto fisik dari server (Supabase Storage) untuk pesanan yang sudah selesai lebih dari 2 bulan lalu.
                            <br />
                            <span className="font-bold">Catatan:</span> Data riwayat transaksi (nama customer, nominal, tanggal) <span className="font-bold underline">TETAP ADA</span> di laporan. Hanya file fotonya saja yang dihapus.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => setShowCleanupConfirm(true)}
                        disabled={isCleaning}
                        className="bg-rose-600 hover:bg-rose-700 whitespace-nowrap h-12 px-6 rounded-xl font-bold shadow-lg shadow-rose-600/20"
                    >
                        {isCleaning ? "Sedang Membersihkan..." : "Bersihkan Sekarang"}
                    </Button>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
                <Button
                    onClick={() => setShowSaveConfirm(true)}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-12 px-8"
                >
                    <Save className="h-4 w-4" /> Simpan Semua Perubahan
                </Button>
            </div>

            <Dialog open={showCleanupConfirm} onOpenChange={setShowCleanupConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Konfirmasi Penghapusan Foto
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-2">
                            <p>
                                Anda akan menghapus semua foto fisik (Storage) dan database foto untuk pesanan yang lebih lama dari <strong>2 bulan</strong>.
                            </p>
                            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-xs text-rose-800">
                                <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. Foto yang sudah dihapus tidak dapat dikembalikan. Data laporan transaksi tetap aman.
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCleanupConfirm(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleCleanup} className="bg-rose-600 hover:bg-rose-700">
                            Ya, Hapus Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Simpan Perubahan?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyimpan perubahan pengaturan? Pengaturan akan langsung berlaku untuk invoice baru.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            Ya, Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
