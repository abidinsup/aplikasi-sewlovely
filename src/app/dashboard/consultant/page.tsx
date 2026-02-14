"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, CheckCircle2, Save, RefreshCw, Wand2, Palette, Shirt, Layers, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCurrentPartner } from "@/lib/auth";

interface AIResult {
    title: string;
    description: string;
    colorHex: string;
    fabricType: string;
    style: string;
}

const AI_USAGE_KEY = "sewlovely_ai_consultant_usage";
const MAX_QUOTA = 3;
const RESET_HOURS = 24;

interface QuotaData {
    count: number;
    lastReset: string;
}

export default function ConsultantPage() {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [result, setResult] = React.useState<AIResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [remainingQuota, setRemainingQuota] = React.useState(MAX_QUOTA);
    const [nextResetTime, setNextResetTime] = React.useState<Date | null>(null);
    const [isMounted, setIsMounted] = React.useState(false);

    // Get quota data from localStorage
    const getQuotaData = (partnerId: string): QuotaData => {
        const usageKey = `${AI_USAGE_KEY}_${partnerId}`;
        const stored = localStorage.getItem(usageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return { count: 0, lastReset: new Date().toISOString() };
            }
        }
        return { count: 0, lastReset: new Date().toISOString() };
    };

    // Save quota data to localStorage
    const saveQuotaData = (partnerId: string, data: QuotaData) => {
        const usageKey = `${AI_USAGE_KEY}_${partnerId}`;
        localStorage.setItem(usageKey, JSON.stringify(data));
    };

    // Check and reset quota if 24 hours have passed
    const checkAndResetQuota = React.useCallback((partnerId: string): QuotaData => {
        const data = getQuotaData(partnerId);
        const lastReset = new Date(data.lastReset);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        if (hoursSinceReset >= RESET_HOURS) {
            // Reset quota
            const newData: QuotaData = { count: 0, lastReset: now.toISOString() };
            saveQuotaData(partnerId, newData);
            return newData;
        }
        return data;
    }, []);

    // Calculate next reset time
    const calculateNextReset = (lastReset: string): Date => {
        const resetDate = new Date(lastReset);
        resetDate.setHours(resetDate.getHours() + RESET_HOURS);
        return resetDate;
    };

    // Check quota on mount
    React.useEffect(() => {
        setIsMounted(true);
        const partner = getCurrentPartner();
        if (partner) {
            const data = checkAndResetQuota(partner.id);
            setRemainingQuota(MAX_QUOTA - data.count);
            setNextResetTime(calculateNextReset(data.lastReset));
        }
    }, [checkAndResetQuota]);

    // Mark AI as used after successful analysis
    const markAIAsUsed = () => {
        const partner = getCurrentPartner();
        if (partner) {
            const data = checkAndResetQuota(partner.id);
            const newData: QuotaData = {
                count: data.count + 1,
                lastReset: data.lastReset
            };
            saveQuotaData(partner.id, newData);
            setRemainingQuota(MAX_QUOTA - newData.count);
        }
    };

    // Handle preview URL lifecycle
    React.useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        // Cleanup
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 5MB");
                return;
            }

            setSelectedFile(file);
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        // Check usage limit
        if (remainingQuota <= 0) {
            toast.error("Kuota habis! Anda sudah menggunakan 3x konsultasi AI hari ini. Kuota akan direset dalam 24 jam.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);

            const response = await fetch("/api/ai-consultant", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menganalisis gambar");
            }

            setResult(data.recommendation);
            markAIAsUsed(); // Mark as used after successful analysis
            toast.success("Analisis AI selesai!");
        } catch (err: any) {
            console.error("Analysis error:", err);
            setError(err.message);
            toast.error(err.message || "Terjadi kesalahan saat analisis");
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-3xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full h-10 w-10 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Konsultan AI <span className="text-emerald-500 font-normal">Gemini</span></h1>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">

                {/* Main Content Area */}
                {!isMounted ? (
                    <div className="flex items-center justify-center p-20">
                        <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
                    </div>
                ) : remainingQuota <= 0 && !result ? (
                    // 1. Quota Used View
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center animate-in fade-in">
                        <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-amber-800 mb-2">Kuota Habis</h3>
                        <p className="text-amber-700 text-sm max-w-sm mx-auto">
                            Anda sudah menggunakan 3x konsultasi AI hari ini. Kuota akan direset otomatis dalam 24 jam.
                        </p>
                        {nextResetTime && (
                            <div className="mt-3 flex items-center justify-center gap-2 text-amber-600 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>Reset: {nextResetTime.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                        )}
                        <Link href="/dashboard">
                            <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
                                Kembali ke Dashboard
                            </Button>
                        </Link>
                    </div>
                ) : !previewUrl ? (
                    // 2. Upload View
                    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Sparkles className="h-10 w-10 text-white animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Upload Foto Ruangan</h2>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                AI Google Gemini akan menganalisis ruangan Anda dan memberikan rekomendasi gorden yang sempurna.
                            </p>
                            {/* Quota Indicator */}
                            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                <span>Sisa kuota: {remainingQuota}/3</span>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-emerald-500 transition-all cursor-pointer group relative bg-slate-100/50">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                            />
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-slate-400 group-hover:text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 group-hover:text-emerald-700">Klik untuk upload</p>
                                <p className="text-xs text-slate-400">Maks. 5MB (JPG, PNG, WebP)</p>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left">
                            <p className="text-sm font-bold text-blue-800 mb-2">💡 Tips untuk hasil terbaik:</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Ambil foto ruangan dengan pencahayaan yang baik</li>
                                <li>• Pastikan jendela terlihat jelas di foto</li>
                                <li>• Sertakan furniture dan dekorasi sekitar</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    // 3. Analysis/Result View
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                            {/* Image Preview */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewUrl || ""} alt="Room Preview" className="w-full h-auto max-h-[500px] object-cover" />

                            {/* Overlay Controls */}
                            {!result && !isAnalyzing && (
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={handleReset} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors">
                                        <RefreshCw className="h-5 w-5" />
                                    </button>
                                </div>
                            )}

                            {/* Scanning Animation Overlay */}
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="h-24 w-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <Sparkles className="h-10 w-10 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <p className="mt-6 text-white font-bold text-lg animate-pulse tracking-wider">AI SEDANG MENGANALISIS...</p>
                                    <p className="mt-2 text-white/70 text-sm">Powered by Google Gemini</p>
                                </div>
                            )}
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                                <p className="text-red-700 font-medium">{error}</p>
                                <div className="flex gap-3 justify-center mt-3">
                                    <Button onClick={handleAnalyze} variant="outline" className="text-red-600 border-red-200">
                                        Coba Lagi
                                    </Button>
                                    <Button onClick={handleReset} variant="ghost" className="text-slate-500">
                                        Ganti Foto
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!result && !isAnalyzing && !error && (
                            <Button onClick={handleAnalyze} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2">
                                <Wand2 className="h-5 w-5" />
                                Analisis dengan AI Gemini
                            </Button>
                        )}

                        {/* Result Card */}
                        {result && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-3xl shadow-sm space-y-5 animate-in card-zoom-in">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-100 rounded-xl">
                                        <Sparkles className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Saran Warna & Gaya</h3>
                                        <p className="text-xs text-slate-500">Berdasarkan Analisis Ruangan</p>
                                    </div>
                                </div>

                                {/* Color Preview */}
                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                                    <div
                                        className="w-16 h-16 rounded-xl shadow-inner border-2 border-white"
                                        style={{ backgroundColor: result.colorHex }}
                                    ></div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg">{result.title}</p>
                                        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{result.colorHex}</p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Shirt className="h-3 w-3 text-emerald-600" />
                                            Jenis Kain
                                        </div>
                                        <span className="font-extrabold text-slate-800">{result.fabricType}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Layers className="h-3 w-3 text-emerald-600" />
                                            Gaya
                                        </div>
                                        <span className="font-extrabold text-slate-800">{result.style}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="prose prose-sm text-slate-700 max-w-none leading-relaxed bg-white/50 p-4 rounded-xl border border-emerald-50/50 italic">
                                    <p>{`"${result.description}"`}</p>
                                </div>

                                <div className="pt-6 flex flex-col gap-5 items-center">
                                    <Button onClick={handleReset} className="w-64 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold h-12 shadow-lg shadow-emerald-500/30">
                                        <RefreshCw className="h-5 w-5 mr-2" />
                                        Ambil Foto Lagi
                                    </Button>
                                    <Link href="/dashboard">
                                        <Button className="w-64 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-12 shadow-lg shadow-emerald-600/20">
                                            <ArrowLeft className="h-5 w-5 mr-2" />
                                            Kembali ke Dashboard
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
