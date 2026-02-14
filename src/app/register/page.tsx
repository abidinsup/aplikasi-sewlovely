"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAppSettings } from "@/providers/AppSettingsProvider";

// Generate kode afiliasi unik
function generateAffiliateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SEW-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default function RegisterPage() {
    const router = useRouter();
    const { appName } = useAppSettings();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    // Form state
    const [fullName, setFullName] = React.useState("");
    const [address, setAddress] = React.useState("");
    const [birthDate, setBirthDate] = React.useState("");
    const [whatsappNumber, setWhatsappNumber] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [bankName, setBankName] = React.useState("");
    const [customBankName, setCustomBankName] = React.useState("");
    const [accountHolder, setAccountHolder] = React.useState("");
    const [accountNumber, setAccountNumber] = React.useState("");
    const [agreedToTerms, setAgreedToTerms] = React.useState(false);

    // Clear any existing session on load to prevent data leakage
    React.useEffect(() => {
        localStorage.removeItem('sewlovely_partner');
        localStorage.removeItem('newPartnerCode');
        localStorage.removeItem('newPartnerName');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Validasi
            if (!fullName || !address || !birthDate || !whatsappNumber || !email || !password || !accountHolder || !accountNumber) {
                throw new Error("Semua field harus diisi");
            }

            if (password.length < 6) {
                throw new Error("Password harus minimal 6 karakter");
            }

            if (password !== confirmPassword) {
                throw new Error("Password dan konfirmasi password tidak sama");
            }

            const finalBankName = bankName === "Lainnya" ? customBankName : bankName;
            if (!finalBankName) {
                throw new Error("Pilih atau masukkan nama bank");
            }

            if (!agreedToTerms) {
                throw new Error("Anda harus menyetujui syarat & ketentuan");
            }

            // 1. Sign Up to Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'partner'
                    }
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    throw new Error("Email sudah terdaftar. Gunakan email lain.");
                }
                throw authError;
            }

            if (!authData.user) {
                throw new Error("Gagal membuat akun login. Silakan coba lagi.");
            }

            // 2. Insert into partners table using the same ID
            const affiliateCode = generateAffiliateCode();
            const { error: supabaseError } = await supabase
                .from('partners')
                .insert([
                    {
                        id: authData.user.id, // Ensure same ID
                        full_name: fullName,
                        address: address,
                        birth_date: birthDate,
                        whatsapp_number: `+62${whatsappNumber}`,
                        email: email.toLowerCase(),
                        password: password, // Store for legacy reasons or remove later
                        bank_name: finalBankName,
                        account_holder: accountHolder,
                        account_number: accountNumber,
                        affiliate_code: affiliateCode,
                    }
                ]);

            if (supabaseError) {
                // Cleanup: if DB insert fails, we should ideally delete the Auth user, 
                // but Auth delete requires admin. For now, just log and throw.
                console.error("DB Insert Error:", supabaseError);
                throw new Error("Gagal menyimpan profil mitra: " + supabaseError.message);
            }

            // Simpan data ke localStorage untuk sukses page & auto-login
            localStorage.setItem('newPartnerCode', affiliateCode);
            localStorage.setItem('newPartnerName', fullName);

            const partnerSession = {
                id: authData.user.id,
                full_name: fullName,
                email: email.toLowerCase(),
                affiliate_code: affiliateCode,
                whatsapp_number: `+62${whatsappNumber}`,
                address: address,
                birth_date: birthDate,
                bank_name: finalBankName,
                account_holder: accountHolder,
                account_number: accountNumber,
            };
            localStorage.setItem('sewlovely_partner', JSON.stringify(partnerSession));

            router.push("/register/success");
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Link href="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                    </Link>
                    <span className="text-lg font-semibold text-gray-900">Pendaftaran Mitra</span>
                </div>

                <div className="card-premium p-6 md:p-10 space-y-8">
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Bergabunglah Bersama {appName}</h1>
                        <p className="text-gray-500 max-w-lg leading-relaxed">
                            Isi data diri Anda untuk menjadi mitra affiliate resmi dan mulai hasilkan komisi tanpa batas.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <Input
                                label="Nama Lengkap"
                                placeholder="Contoh: Siti Aminah"
                                className="input-field"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Alamat Lengkap</label>
                                <textarea
                                    className="input-field min-h-[120px] py-3 resize-none"
                                    placeholder="Masukkan alamat domisili lengkap"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Tanggal Lahir</label>
                                    <Input
                                        placeholder="mm/dd/yyyy"
                                        type="date"
                                        className="input-field cursor-pointer"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Nomor WhatsApp</label>
                                    <div className="grid grid-cols-[80px_1fr] gap-3">
                                        <div className="flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-500 font-medium">
                                            +62
                                        </div>
                                        <Input
                                            placeholder="812-3456-7890"
                                            type="tel"
                                            className="input-field"
                                            value={whatsappNumber}
                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Input
                                label="Alamat Email"
                                placeholder="nama@email.com"
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PasswordInput
                                    label="Password"
                                    placeholder="Minimal 6 karakter"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <PasswordInput
                                    label="Konfirmasi Password"
                                    placeholder="Ulangi password"
                                    className="input-field"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-8 space-y-6">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                Informasi Pembayaran
                            </h3>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Nama Bank</label>
                                    <div className="relative">
                                        <select
                                            className="input-field appearance-none cursor-pointer"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Pilih Bank</option>
                                            <option value="BCA">BCA</option>
                                            <option value="Mandiri">Mandiri</option>
                                            <option value="BRI">BRI</option>
                                            <option value="BNI">BNI</option>
                                            <option value="BSI">BSI</option>
                                            <option value="Jago Syariah">Jago Syariah</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {bankName === "Lainnya" && (
                                    <div className="animate-accordion-down">
                                        <Input
                                            label="Nama Bank/E-Wallet"
                                            placeholder="Masukkan nama bank anda"
                                            className="input-field"
                                            value={customBankName}
                                            onChange={(e) => setCustomBankName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                <Input
                                    label="Nama Pemilik Rekening"
                                    placeholder="Masukkan nama pemilik rekening"
                                    className="input-field"
                                    value={accountHolder}
                                    onChange={(e) => setAccountHolder(e.target.value)}
                                    required
                                />

                                <Input
                                    label="Nomor Rekening"
                                    placeholder="Masukkan no. rekening"
                                    type="number"
                                    className="input-field no-spinner"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                />

                                <div className="bg-emerald-50/80 rounded-2xl p-4 flex gap-3 text-sm text-emerald-800 border border-emerald-100/50">
                                    <div className="bg-emerald-200/50 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                                        <span className="font-bold text-xs">i</span>
                                    </div>
                                    <p className="leading-snug">
                                        <span className="font-semibold">Catatan:</span> Kode Afiliasi unik Anda akan dibuat secara otomatis dan ditampilkan setelah pendaftaran berhasil.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 pt-2 pl-1">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1 h-5 w-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-600 transition-all cursor-pointer"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer select-none">
                                Saya menyetujui <a href="#" className="text-emerald-600 font-bold hover:underline hover:text-emerald-700">Syarat & Ketentuan</a> menjadi mitra {appName}.
                            </label>
                        </div>

                        <Button
                            className={cn(
                                "w-full h-14 text-lg font-bold rounded-2xl transition-all duration-300",
                                "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
                                "text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30",
                                "transform hover:-translate-y-0.5 active:translate-y-0"
                            )}
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Memproses..." : (
                                <>
                                    Daftar Sebagai Mitra <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
