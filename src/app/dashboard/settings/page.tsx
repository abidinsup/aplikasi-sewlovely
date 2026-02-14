"use client";

import * as React from "react";
import { User, CreditCard, Save, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCurrentPartner, Partner } from "@/lib/auth";
import { createPartnerRequest } from "@/lib/commission";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [partner, setPartner] = React.useState<Partner | null>(null);

    const [formData, setFormData] = React.useState({
        phone: "",
        bankName: "BCA",
        customBankName: "",
        bankAccountName: "",
        bankAccountNumber: "",
    });

    React.useEffect(() => {
        const currentPartner = getCurrentPartner();
        if (currentPartner) {
            setPartner(currentPartner);
            // Parse phone number (remove +62 prefix)
            const phone = currentPartner.whatsapp_number?.replace('+62', '') || '';
            setFormData({
                phone: phone,
                bankName: currentPartner.bank_name || "BCA",
                customBankName: "",
                bankAccountName: currentPartner.account_holder || "",
                bankAccountNumber: currentPartner.account_number || "",
            });
        }
    }, []);

    const handleStartEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        // Reset form data to original values
        if (partner) {
            const phone = partner.whatsapp_number?.replace('+62', '') || '';
            setFormData({
                phone: phone,
                bankName: partner.bank_name || "BCA",
                customBankName: "",
                bankAccountName: partner.account_holder || "",
                bankAccountNumber: partner.account_number || "",
            });
        }
        setIsEditing(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner) return;

        setIsLoading(true);

        try {
            const currentPhone = partner.whatsapp_number?.replace('+62', '') || '';
            const newPhone = formData.phone;

            const finalBankName = formData.bankName === "Lainnya" ? formData.customBankName : formData.bankName;

            // Check & Submit Phone Request
            if (currentPhone !== newPhone) {
                const { success, error } = await createPartnerRequest(
                    partner.id,
                    'phone',
                    partner.whatsapp_number || '',
                    `+62${newPhone}`
                );
                if (!success) throw new Error(error || "Gagal mengajukan perubahan No. WhatsApp");
            }

            // Check & Submit Bank Request
            const currentBankData = {
                bank_name: partner.bank_name,
                account_holder: partner.account_holder,
                account_number: partner.account_number
            };
            const newBankData = {
                bank_name: finalBankName,
                account_holder: formData.bankAccountName,
                account_number: formData.bankAccountNumber
            };

            if (JSON.stringify(currentBankData) !== JSON.stringify(newBankData)) {
                const { success, error } = await createPartnerRequest(
                    partner.id,
                    'bank',
                    JSON.stringify(currentBankData),
                    JSON.stringify(newBankData)
                );
                if (!success) throw new Error(error || "Gagal mengajukan perubahan Rekening Bank");
            }

            toast.success("Permintaan perubahan data berhasil dikirim", {
                description: "Admin akan meninjau data Anda sebelum diperbarui."
            });

            setIsEditing(false);
            // Note: We don't update local partner state immediately because it's pending approval.
            // Ideally we should show "Pending" status on UI, but for now just reverting edit mode is enough.

        } catch (err: any) {
            toast.error("Gagal menyimpan perubahan", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!partner) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20 pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pengaturan Aplikasi</h1>
                    <p className="text-gray-500 mt-2 text-lg">Kelola data mitra, informasi pembayaran, dan preferensi akun Anda.</p>
                </div>

                {!isEditing && (
                    <Button
                        onClick={handleStartEdit}
                        className="gap-2 h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20"
                    >
                        <Pencil className="h-4 w-4" />
                        Rubah Data
                    </Button>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
                    {/* 1. Edit Kontak (Left Column) */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-8 h-full">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="bg-emerald-50 p-4 rounded-2xl">
                                <User className="h-7 w-7 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Kontak & Keamanan</h3>
                                <p className="text-sm text-gray-500">Atur informasi kontak utama anda</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">Nomor WhatsApp</label>
                                <div className="grid grid-cols-[90px_1fr] gap-4">
                                    <div className="flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-gray-500 font-bold h-14">
                                        +62
                                    </div>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className={cn(
                                            "h-14 rounded-2xl text-lg transition-all",
                                            isEditing
                                                ? "border-emerald-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                : "border-slate-100 bg-slate-50 cursor-not-allowed"
                                        )}
                                        placeholder="812-3456-7890"
                                        readOnly={!isEditing}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 ml-1 leading-relaxed">
                                    Nomor ini akan digunakan untuk notifikasi pesanan dan komunikasi dengan tim support. Pastikan nomor aktif.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Edit Bank (Right Column) */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-8 h-full">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="bg-emerald-50 p-4 rounded-2xl">
                                <CreditCard className="h-7 w-7 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Rekening Pencairan</h3>
                                <p className="text-sm text-gray-500">Rekening untuk menerima komisi</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">Nama Bank</label>
                                <div className="relative">
                                    <select
                                        className={cn(
                                            "w-full h-14 rounded-2xl border px-4 text-lg text-gray-900 appearance-none transition-all",
                                            isEditing
                                                ? "border-emerald-300 bg-white cursor-pointer focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                                : "border-slate-100 bg-slate-50 cursor-not-allowed"
                                        )}
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        disabled={!isEditing}
                                    >
                                        <option value="BCA">BCA</option>
                                        <option value="Mandiri">Mandiri</option>
                                        <option value="BRI">BRI</option>
                                        <option value="BNI">BNI</option>
                                        <option value="Bank Jago">Bank Jago</option>
                                        <option value="BSI">BSI</option>
                                        <option value="Lainnya">Bank Lain (Ketik Manual)</option>
                                    </select>
                                    {/* Custom Dropdown Arrow */}
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Custom Bank Input */}
                            {formData.bankName === "Lainnya" && isEditing && (
                                <div className="space-y-3 animate-accordion-down">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Nama Bank Lain</label>
                                    <Input
                                        placeholder="Contoh: SeaBank, Bank Kalbar, dll"
                                        value={formData.customBankName}
                                        onChange={(e) => setFormData({ ...formData, customBankName: e.target.value })}
                                        className="h-14 rounded-2xl border-emerald-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">Nomor Rekening</label>
                                <Input
                                    value={formData.bankAccountNumber}
                                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                    type="number"
                                    className={cn(
                                        "h-14 rounded-2xl text-lg font-mono tracking-wide transition-all",
                                        isEditing
                                            ? "border-emerald-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                            : "border-slate-100 bg-slate-50 cursor-not-allowed"
                                    )}
                                    placeholder="Masukkan nomor rekening"
                                    readOnly={!isEditing}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 ml-1">Nama Pemilik Rekening</label>
                                <Input
                                    value={formData.bankAccountName}
                                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                                    className={cn(
                                        "h-14 rounded-2xl text-lg transition-all",
                                        isEditing
                                            ? "border-emerald-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                            : "border-slate-100 bg-slate-50 cursor-not-allowed"
                                    )}
                                    placeholder="Nama sesuai buku tabungan"
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>

                        {/* Action Buttons - Only show when editing */}
                        {isEditing && (
                            <div className="pt-6 flex flex-col sm:flex-row gap-4">
                                <Button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    className="flex-1 h-14 text-lg font-bold rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    <X className="mr-2 h-5 w-5" />
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className={cn(
                                        "flex-1 h-14 text-lg font-bold rounded-2xl transition-all duration-300",
                                        "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
                                        "text-white shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30",
                                        "transform hover:-translate-y-1 active:translate-y-0"
                                    )}
                                >
                                    {isLoading ? "Menyimpan..." : (
                                        <>
                                            <Save className="mr-2 h-5 w-5" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* Info Box when not editing */}
            {!isEditing && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
                        <Pencil className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-800 mb-1">Data Terkunci</p>
                        <p className="text-sm text-amber-700">
                            Klik tombol <span className="font-bold">&quot;Rubah Data&quot;</span> di atas untuk mengaktifkan mode edit dan mengubah informasi Anda.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
