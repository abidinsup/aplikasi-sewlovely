"use client";

import * as React from "react";
import { ArrowLeft, RefreshCw, Grid, Layers, Building2, Trash2, Printer, Plus, CheckCircle2, Stethoscope, Activity, Upload, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getProducts, Product } from "@/lib/products";

export default function HospitalCalculatorPage() {
    const router = useRouter();

    // State
    const [customerInfo, setCustomerInfo] = React.useState({ name: "", phone: "", address: "" });
    const [windows, setWindows] = React.useState([{ id: 1, width: "", height: "" }]);
    const [fabricType, setFabricType] = React.useState<"antibakteri" | "antidarah">("antibakteri");
    const [railType, setRailType] = React.useState<"flexy" | "standar">("flexy");
    const [surveyDate, setSurveyDate] = React.useState<string | null>(null);
    const [surveyTime, setSurveyTime] = React.useState<string | null>(null);
    const [totalPrice, setTotalPrice] = React.useState(0);
    const [unitPrice, setUnitPrice] = React.useState(0);
    const [prices, setPrices] = React.useState<Product[]>([]);
    const [kodeGordenPreview, setKodeGordenPreview] = React.useState<string | null>(null);
    const [motifGordenPreview, setMotifGordenPreview] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchPrices = async () => {
            const result = await getProducts();
            if (result.success && result.data) {
                setPrices(result.data);
            }
        };
        fetchPrices();
    }, []);

    // Handlers
    const addWindow = () => {
        setWindows([...windows, { id: Date.now(), width: "", height: "" }]);
    };

    const removeWindow = (id: number) => {
        if (windows.length > 1) {
            setWindows(windows.filter(w => w.id !== id));
        }
    };

    const updateWindow = (id: number, field: 'width' | 'height', value: string) => {
        setWindows(windows.map(w => w.id === id ? { ...w, [field]: value } : w));
    };

    const handleCreateInvoice = async () => {
        // Validation
        const isCustomerInfoComplete = customerInfo.name && customerInfo.phone && customerInfo.address;
        const areFieldsComplete = windows.every(w => w.width && w.height);

        if (!isCustomerInfoComplete || !areFieldsComplete) {
            toast.warning("Mohon semua data dilengkapi");
            return;
        }

        // Validate no zero values
        const hasZeroValues = windows.some(w => parseFloat(w.width) <= 0 || parseFloat(w.height) <= 0);
        if (hasZeroValues) {
            toast.error("Lebar dan tinggi jendela harus lebih dari 0");
            return;
        }

        // Validate total price is not zero
        if (totalPrice <= 0) {
            toast.error("Total harga tidak boleh Rp 0. Pastikan ukuran jendela sudah benar.");
            return;
        }

        // Admin creates invoices directly

        const orderData = {
            customerInfo,
            windows,
            fabricType,
            railType,
            totalPrice,
            unitPrice,
            surveyDate,
            surveyTime,
            affiliateCode: "ADMIN",
            kodeGordenPhoto: kodeGordenPreview,
            motifGordenPhoto: motifGordenPreview,
        };
        const encodedData = btoa(JSON.stringify(orderData));
        router.push(`/admin/calculator/rs/invoice?data=${encodedData}&mode=simulasi`);
    };

    // Calculation Logic
    React.useEffect(() => {
        if (prices.length === 0) return;

        const hospitalProducts = prices.filter(p => p.category === "Hospital");
        const packageAntiBakteri = hospitalProducts.find(p => p.name.toUpperCase().includes("ANTI BAKTERI"))?.price || 0;
        const packageAntiDarah = hospitalProducts.find(p => p.name.toUpperCase().includes("ANTI DARAH"))?.price || 0;
        const packageRelFlexy = hospitalProducts.find(p => p.name.toUpperCase().includes("REL FLEXY"))?.price || 0;
        const packageRelStandard = hospitalProducts.find(p => p.name.toUpperCase().includes("REL STANDAR") || p.name.toUpperCase().includes("REL STANDARD"))?.price || 0;

        let fabricPrice = fabricType === "antibakteri" ? packageAntiBakteri : packageAntiDarah;
        let railPrice = railType === "flexy" ? packageRelFlexy : packageRelStandard;

        const basePackagePrice = fabricPrice + railPrice;
        setUnitPrice(basePackagePrice);

        const totalCalculated = windows.reduce((acc, curr) => {
            const w = Number(curr.width) || 0;
            const h = Number(curr.height) || 0;
            if (w > 0 && h > 0) {
                // Min charge 1m2 per window
                const area = Math.max(1, w * h);
                return acc + (area * basePackagePrice);
            }
            return acc;
        }, 0);

        setTotalPrice(totalCalculated);
    }, [windows, fabricType, railType, prices]);

    const SummaryCard = ({ isMobile = false }) => (
        <div className={cn(
            "bg-white border-slate-100",
            isMobile ? "max-w-md mx-auto space-y-4" : "p-6 rounded-3xl border shadow-lg shadow-emerald-900/5 space-y-6 sticky top-24"
        )}>
            {!isMobile && <h3 className="font-bold text-slate-900 text-lg mb-4">Ringkasan Pesanan</h3>}

            <div className="space-y-4">
                <div className="flex items-end justify-between px-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimasi Total</p>
                        <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                            Rp {totalPrice.toLocaleString("id-ID")}
                        </h3>
                    </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 hidden lg:block">
                    <div className="flex justify-between">
                        <span>Jenis Paket</span>
                        <span className="font-bold capitalize">{fabricType} + Rel</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Jenis Kain</span>
                        <span className="font-bold capitalize">{fabricType === 'antibakteri' ? 'Anti Bakteri (Polyester)' : 'Anti Darah (PVC)'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tipe Rel</span>
                        <span className="font-bold capitalize">{railType === 'flexy' ? 'Rel Flexy' : 'Rel Standar'}</span>
                    </div>
                </div>

                <Button onClick={handleCreateInvoice} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/50 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-95">
                    <Printer className="h-5 w-5" />
                    Buat Invoice
                </Button>

                <p className="text-[10px] text-slate-400 italic text-center leading-relaxed">
                    *Harga sudah termasuk pemasangan
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/calculator">
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full h-10 w-10 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kalkulator Gorden RS</h1>
                    </div>
                    <Button onClick={() => setWindows([{ id: 1, width: "", height: "" }])} variant="ghost" size="sm" className="hover:bg-slate-100 rounded-xl text-slate-500 gap-2 hidden md:flex">
                        <RefreshCw className="h-4 w-4" />
                        <span>Reset Ukuran</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-32 lg:pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN - FORM INPUTS */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* 0. Data Pemesan */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Data Rumah Sakit / Klinik</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Nama RS / Klinik</label>
                                    <Input
                                        placeholder="Nama Institusi"
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">No. WhatsApp PIC</label>
                                    <Input
                                        placeholder="085159588681"
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Alamat Pemasangan</label>
                                    <Input
                                        placeholder="Jl. Kesehatan No. 99, Jakarta"
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 1. Ukuran Jendela */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Grid className="h-5 w-5" /></div>
                                    <h2 className="font-bold text-slate-900 text-lg">Ukuran Bidang</h2>
                                </div>
                                <Button onClick={addWindow} size="sm" variant="outline" className="text-xs h-8 gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800">
                                    <Plus className="h-3 w-3" /> Tambah Bidang
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {windows.map((window, index) => (
                                    <div key={window.id} className={cn("relative p-4 rounded-2xl border transition-all", windows.length > 1 ? "bg-slate-50/50 border-slate-200" : "bg-transparent border-transparent p-0")}>
                                        {windows.length > 1 && (
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Bidang {index + 1}</span>
                                                <button onClick={() => removeWindow(window.id)} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Lebar (m)</label>
                                                <div className="relative group">
                                                    <Input
                                                        type="number"
                                                        placeholder="2.0"
                                                        className="h-14 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 text-center text-xl font-bold text-slate-700 rounded-2xl group-hover:bg-white group-hover:border-emerald-200 transition-all [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-200"
                                                        value={window.width}
                                                        onChange={(e) => updateWindow(window.id, 'width', e.target.value)}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-300 font-medium">meter</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Tinggi (m)</label>
                                                <div className="relative group">
                                                    <Input
                                                        type="number"
                                                        placeholder="2.0"
                                                        className="h-14 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 text-center text-xl font-bold text-slate-700 rounded-2xl group-hover:bg-white group-hover:border-emerald-200 transition-all [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-200"
                                                        value={window.height}
                                                        onChange={(e) => updateWindow(window.id, 'height', e.target.value)}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-300 font-medium">meter</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 2. Pilihan Kain */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Layers className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Pilihan Kain</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFabricType("antibakteri")}
                                    className={cn(
                                        "h-24 px-6 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                        fabricType === "antibakteri"
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                            : "bg-white border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-2 text-emerald-800">
                                        <Stethoscope className="h-5 w-5" />
                                        <span className="font-bold text-lg">Anti Bakteri (Polyester)</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Standar Kebersihan Tinggi</span>
                                    {fabricType === "antibakteri" && <div className="absolute top-1/2 -translate-y-1/2 right-6 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>}
                                </button>

                                <button
                                    onClick={() => setFabricType("antidarah")}
                                    className={cn(
                                        "h-24 px-6 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                        fabricType === "antidarah"
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                            : "bg-white border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-2 text-emerald-800">
                                        <Activity className="h-5 w-5" />
                                        <span className="font-bold text-lg">Anti Darah (PVC)</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">Mudah Dibersihkan & Steril</span>
                                    {fabricType === "antidarah" && <div className="absolute top-1/2 -translate-y-1/2 right-6 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>}
                                </button>
                            </div>
                        </section>

                        {/* 3. Pilihan Rel */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Layers className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Pilihan Rel</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRailType("flexy")}
                                    className={cn(
                                        "h-24 px-6 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                        railType === "flexy"
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                            : "bg-white border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn("font-bold text-lg", railType === "flexy" ? "text-emerald-800" : "text-slate-800")}>Rel Flexy</span>
                                    <span className="text-xs font-medium text-slate-500">Fleksibel & Bisa Melengkung</span>
                                    {railType === "flexy" && <div className="absolute top-1/2 -translate-y-1/2 right-6 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>}
                                </button>

                                <button
                                    onClick={() => setRailType("standar")}
                                    className={cn(
                                        "h-24 px-6 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                        railType === "standar"
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                            : "bg-white border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn("font-bold text-lg", railType === "standar" ? "text-emerald-800" : "text-slate-800")}>Rel Standar</span>
                                    <span className="text-xs font-medium text-slate-500">Lurus & Kokoh</span>
                                    {railType === "standar" && <div className="absolute top-1/2 -translate-y-1/2 right-6 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>}
                                </button>
                            </div>
                        </section>

                        {/* No Survey Schedule for Admin */}

                        {/* 4. Upload Foto */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Upload className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Upload Foto</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Upload Kode Gorden */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Kode Gorden</label>
                                    {kodeGordenPreview ? (
                                        <div className="relative group">
                                            <img src={kodeGordenPreview} alt="Kode Gorden" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                                                <label className="cursor-pointer bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:bg-white/30 transition-colors">
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setKodeGordenPreview(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                    Ganti Foto
                                                </label>
                                                <button onClick={() => setKodeGordenPreview(null)} className="bg-red-500/80 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:bg-red-600 transition-colors">
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setKodeGordenPreview(reader.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                            <div className="h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                                <Upload className="h-6 w-6 text-slate-400" />
                                                <span className="text-xs text-slate-500">Klik untuk upload</span>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                {/* Upload Motif Gorden */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Motif Gorden</label>
                                    {motifGordenPreview ? (
                                        <div className="relative group">
                                            <img src={motifGordenPreview} alt="Motif Gorden" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                                                <label className="cursor-pointer bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:bg-white/30 transition-colors">
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setMotifGordenPreview(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                    Ganti Foto
                                                </label>
                                                <button onClick={() => setMotifGordenPreview(null)} className="bg-red-500/80 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:bg-red-600 transition-colors">
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setMotifGordenPreview(reader.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                            <div className="h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                                <ImageIcon className="h-6 w-6 text-slate-400" />
                                                <span className="text-xs text-slate-500">Klik untuk upload</span>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN - SUMMARY */}
                    <div className="lg:col-span-4 rounded-3xl">
                        <SummaryCard />
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Sheet */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-8 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.05)] z-30 lg:hidden">
                <SummaryCard isMobile={true} />
            </div>
        </div>
    );
}
