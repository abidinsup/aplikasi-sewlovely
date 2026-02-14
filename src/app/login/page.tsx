"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as React from "react";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/ui/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Logo } from "@/components/ui/logo";
import { loginWithEmail, loginAsAdmin } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [credentials, setCredentials] = React.useState({ username: "", password: "" });
    const [failedAttempts, setFailedAttempts] = React.useState(0);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validasi input
        if (!credentials.username || !credentials.password) {
            toast.error("Login Gagal", { description: "Mohon lengkapi email dan password." });
            setIsLoading(false);
            return;
        }

        const cleanUsername = credentials.username.trim().toLowerCase();
        const cleanPassword = credentials.password.trim();

        // Login mitra via Supabase dengan validasi password
        console.log("Attempting login for:", cleanUsername);
        const result = await loginWithEmail(cleanUsername, cleanPassword);
        console.log("Login result:", result);

        if (result.success && result.partner) {
            setFailedAttempts(0);
            // Login Mitra Sukses
            toast.success("Login Berhasil", {
                description: `Selamat datang, ${result.partner.full_name}!`
            });
            router.push("/dashboard");
        } else {
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);

            if (newAttempts >= 3) {
                toast.warning("Peringatan Keamanan", {
                    description: "Terlalu banyak percobaan gagal. Pastikan email dan password Anda benar demi keamanan akun."
                });
            }

            // Khusus Admin: Cek email jika login berhasil secara auth tapi gagal profile check
            if (cleanUsername === "pecintajahit91@gmail.com") {
                // Jika error adalah "Profil mitra tidak ditemukan", berarti password BENAR (auth sukses),
                // tetapi akun tidak ada di tabel partners (karena admin ga punya record di tabel partners).
                if (result.error === 'Profil mitra tidak ditemukan.') {
                    setFailedAttempts(0);
                    loginAsAdmin();
                    toast.success("Login Berhasil", { description: "Selamat datang kembali, Owner!" });
                    router.push("/admin/dashboard");
                    return;
                }
            }

            toast.error("Login Gagal", {
                description: result.error || "Email atau password salah."
            });
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title=""
            subtitle="Silakan masuk untuk melanjutkan pesanan Anda"
            icon={<Logo />}
        >
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                    <Input
                        label="Email atau Username"
                        placeholder="Contoh: user@email.com"
                        type="email"
                        className="h-12"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        required
                    />
                    <div className="space-y-1.5">
                        <PasswordInput
                            label="Kata Sandi"
                            placeholder="Masukkan kata sandi"
                            className="h-12"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            required
                        />
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                Lupa Kata Sandi?
                            </Link>
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Memproses..." : (
                        <>Masuk <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </form>

            <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Atau</span>
                </div>
            </div>

            <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Belum punya akun? </span>
                <Link
                    href="/register"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                    Daftar Mitra Affiliate
                </Link>
            </div>
        </AuthLayout>
    );
}
