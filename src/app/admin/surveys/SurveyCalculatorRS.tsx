"use client";

import * as React from "react";
import { ArrowLeft, RefreshCw, Grid, Layers, Building2, Trash2, Printer, Plus, CheckCircle2, Stethoscope, Activity, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getProducts, Product } from "@/lib/products";

interface SurveyCalculatorProps {
    survey: any;
    onBack: () => void;
}

export default function SurveyCalculatorRS({ survey, onBack }: SurveyCalculatorProps) {
    const router = useRouter();

    // State
    const [customerInfo, setCustomerInfo] = React.useState({
        name: survey.customer_name || "",
        phone: survey.customer_phone || "",
        address: survey.customer_address || ""
    });
    const [windows, setWindows] = React.useState([{ id: 1, width: "", height: "" }]);
    const [fabricType, setFabricType] = React.useState<"antibakteri" | "antidarah">("antibakteri");
    const [railType, setRailType] = React.useState<"flexy" | "standar">("flexy");
    const [surveyDate] = React.useState<string | null>(survey.survey_date);
    const [surveyTime] = React.useState<string | null>(survey.survey_time);
    const [totalPrice, setTotalPrice] = React.useState(0);
    const [unitPrice, setUnitPrice] = React.useState(0);
    const [prices, setPrices] = React.useState<Product[]>([]);
    const [savedItems, setSavedItems] = React.useState<any[]>([]);

    // Connecting Pipe State - Defaulting to always active
    const [selectedPipeId, setSelectedPipeId] = React.useState<number | null>(null);

    // Initialize previews with survey photos if available
    const [kodeGordenPreview, setKodeGordenPreview] = React.useState<string | null>(survey.kode_gorden_url || null);
    const [motifGordenPreview, setMotifGordenPreview] = React.useState<string | null>(survey.motif_gorden_url || null);

    React.useEffect(() => {
        const fetchPrices = async () => {
            const result = await getProducts();
            if (result.success && result.data) {
                setPrices(result.data);
                // Auto-select standard pipe (35-60 cm)
                const defaultPipe = result.data.find(p => p.name.includes("Connecting Pipe 35-60"));
                if (defaultPipe) setSelectedPipeId(defaultPipe.id);
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

    const addItemToList = () => {
        const areWindowsComplete = windows.every(w => w.width && w.height);
        if (!areWindowsComplete) {
            toast.warning("Mohon lengkapi ukuran jendela dahulu");
            return;
        }

        const hospitalProducts = prices.filter(p => p.category === "Hospital");
        const fabricProduct = hospitalProducts.find(p =>
            fabricType === "antibakteri" ? p.name.toUpperCase().includes("ANTI BAKTERI") : p.name.toUpperCase().includes("ANTI DARAH")
        );
        const railProduct = hospitalProducts.find(p =>
            railType === "flexy" ? p.name.toUpperCase().includes("REL FLEXY") : p.name.toUpperCase().includes("REL STANDAR")
        );
        const pipeProduct = selectedPipeId ? hospitalProducts.find(p => p.id === selectedPipeId) : null;

        const fPrice = fabricProduct?.price || 0;
        const rPrice = railProduct?.price || 0;
        const pPrice = pipeProduct?.price || 0;

        const currentWindowsTotal = windows.reduce((acc, curr) => {
            const w = Number(curr.width) || 0;
            const h = Number(curr.height) || 0;

            if (w > 0 && h > 0) {
                const wCalculated = Math.max(1, w);
                const panels = Math.ceil(h / 2.8);
                const pipesCount = Math.ceil(wCalculated / 1);

                const windowFabricTotal = wCalculated * fPrice * panels;
                const windowRailTotal = wCalculated * rPrice;
                const windowPipeTotal = pipesCount * pPrice; // Always included

                return acc + windowFabricTotal + windowRailTotal + windowPipeTotal;
            }
            return acc;
        }, 0);

        const newItem = {
            id: Date.now().toString(),
            productName: `Gorden RS (${fabricType === 'antibakteri' ? 'Anti Bakteri' : 'Anti Darah'})`,
            windows: [...windows],
            fabricType,
            railType,
            fabricPrice: fPrice,
            railPrice: rPrice,
            useConnectingPipe: true,
            pipePrice: pPrice,
            pipeName: pipeProduct?.name || "Connecting Pipe 35-60 cm",
            itemTotalPrice: currentWindowsTotal
        };

        setSavedItems([...savedItems, newItem]);
        setWindows([{ id: Date.now(), width: "", height: "" }]);
        toast.success("Berhasil ditambah ke daftar!");
    };

    const removeItemFromList = (id: string) => {
        setSavedItems(savedItems.filter(item => item.id !== id));
    };

    const handleCreateInvoice = async () => {
        const isCustomerInfoComplete = customerInfo.name && customerInfo.phone && customerInfo.address;
        if (!isCustomerInfoComplete) {
            toast.warning("Mohon lengkapi data pemesan");
            return;
        }

        let finalItems = [...savedItems];
        const areCurrentWindowsComplete = windows.some(w => w.width && w.height);

        if (areCurrentWindowsComplete && windows.every(w => w.width && w.height)) {
            const hospitalProducts = prices.filter(p => p.category === "Hospital");
            const fabricProduct = hospitalProducts.find(p =>
                fabricType === "antibakteri" ? p.name.toUpperCase().includes("ANTI BAKTERI") : p.name.toUpperCase().includes("ANTI DARAH")
            );
            const railProduct = hospitalProducts.find(p =>
                railType === "flexy" ? p.name.toUpperCase().includes("REL FLEXY") : p.name.toUpperCase().includes("REL STANDAR")
            );
            const pipeProduct = selectedPipeId ? hospitalProducts.find(p => p.id === selectedPipeId) : null;

            const fPrice = fabricProduct?.price || 0;
            const rPrice = railProduct?.price || 0;
            const pPrice = pipeProduct?.price || 0;

            const currentWindowsTotal = windows.reduce((acc, curr) => {
                const w = Number(curr.width) || 0;
                const h = Number(curr.height) || 0;

                if (w > 0 && h > 0) {
                    const wCalculated = Math.max(1, w);
                    const panels = Math.ceil(h / 2.8);
                    const pipesCount = Math.ceil(wCalculated / 1);

                    const windowFabricTotal = wCalculated * fPrice * panels;
                    const windowRailTotal = wCalculated * rPrice;
                    const windowPipeTotal = pipesCount * pPrice; // Always included

                    return acc + windowFabricTotal + windowRailTotal + windowPipeTotal;
                }
                return acc;
            }, 0);

            finalItems.push({
                id: "current-" + Date.now(),
                productName: `Gorden RS (${fabricType === 'antibakteri' ? 'Anti Bakteri' : 'Anti Darah'})`,
                windows: [...windows],
                fabricType,
                railType,
                fabricPrice: fPrice,
                railPrice: rPrice,
                useConnectingPipe: true,
                pipePrice: pPrice,
                pipeName: pipeProduct?.name || "Connecting Pipe 35-60 cm",
                itemTotalPrice: currentWindowsTotal
            });
        }

        if (finalItems.length === 0) {
            toast.warning("Daftar pesanan masih kosong. Gunakan tombol 'Simpan ke Daftar'.");
            return;
        }

        const orderData = {
            customerInfo,
            savedItems: finalItems,
            totalPrice,
            surveyDate,
            surveyTime,
            partner_id: survey.partner_id,
            affiliateCode: survey.partner_id ? "PARTNER" : "ADMIN",
            kodeGordenPhoto: kodeGordenPreview,
            motifGordenPhoto: motifGordenPreview,
            survey_id: survey.id,
        };
        const encodedData = btoa(JSON.stringify(orderData));
        router.push(`/admin/calculator/rs/invoice?data=${encodedData}`);
    };

    // Calculation Logic
    React.useEffect(() => {
        if (prices.length === 0) return;

        const hospitalProducts = prices.filter(p => p.category === "Hospital");
        const fabricProduct = hospitalProducts.find(p =>
            fabricType === "antibakteri" ? p.name.toUpperCase().includes("ANTI BAKTERI") : p.name.toUpperCase().includes("ANTI DARAH")
        );
        const railProduct = hospitalProducts.find(p =>
            railType === "flexy" ? p.name.toUpperCase().includes("REL FLEXY") : p.name.toUpperCase().includes("REL STANDAR")
        );
        const pipeProduct = selectedPipeId ? hospitalProducts.find(p => p.id === selectedPipeId) : null;

        const fPrice = fabricProduct?.price || 0;
        const rPrice = railProduct?.price || 0;
        const pPrice = pipeProduct?.price || 0;

        const totalWindowsCurrent = windows.reduce((acc, curr) => {
            const w = Number(curr.width) || 0;
            const h = Number(curr.height) || 0;
            if (w > 0 && h > 0) {
                const wCalculated = Math.max(1, w);
                const panels = Math.ceil(h / 2.8);
                const pipesCount = Math.ceil(wCalculated / 1);

                const windowFabricTotal = wCalculated * fPrice * panels;
                const windowRailTotal = wCalculated * rPrice;
                const windowPipeTotal = pipesCount * pPrice; // Always included

                return acc + windowFabricTotal + windowRailTotal + windowPipeTotal;
            }
            return acc;
        }, 0);

        setUnitPrice(fPrice + rPrice); // Base unit price for display

        const savedTotal = savedItems.reduce((acc, item) => acc + item.itemTotalPrice, 0);
        setTotalPrice(totalWindowsCurrent + savedTotal);
    }, [windows, fabricType, railType, prices, savedItems, selectedPipeId]);

    const SummaryCard = ({ isMobile = false }) => (
        <div className={cn(
            "bg-white border-slate-100",
            isMobile ? "max-w-md mx-auto space-y-4" : "p-6 rounded-3xl border shadow-lg shadow-emerald-900/5 space-y-6 sticky top-6"
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

                <div className="space-y-4 text-[11px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 hidden lg:block">
                    <div className="space-y-2">
                        <div className="flex justify-between font-bold text-slate-900 border-b pb-1 mb-1">
                            <span>Detail Bidang Saat Ini</span>
                        </div>
                        {windows.map((w, idx) => {
                            const width = Number(w.width) || 0;
                            const height = Number(w.height) || 0;
                            const wCalc = Math.max(1, width);
                            const panels = Math.ceil(height / 2.8);
                            const fabricNeeded = wCalc * 1.5 * panels;

                            return (
                                <div key={idx} className="space-y-1 pb-2 border-b border-slate-200 last:border-0">
                                    <div className="flex justify-between font-medium">
                                        <span>Bidang {idx + 1}: {width}m x {height}m</span>
                                        <span className="text-emerald-600">{panels} Panel</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Kebutuhan Kain (1.5x)</span>
                                        <span>{fabricNeeded.toFixed(1)} m</span>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex justify-between pt-1">
                            <span>Harga Kain/m</span>
                            <span className="font-bold">Rp {((prices.find(p => fabricType === "antibakteri" ? p.name.includes("Bakteri") : p.name.includes("Darah"))?.price) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Harga Rel/m</span>
                            <span className="font-bold">Rp {((prices.find(p => railType === "flexy" ? p.name.includes("Flexy") : p.name.includes("Standar"))?.price) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                            <span>Connecting Pipe (35-60cm)</span>
                            <span className="font-bold">Rp {(prices.find(p => p.id === selectedPipeId)?.price || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-dashed border-slate-300">
                            <span>Harga Paket/m</span>
                            <span className="font-bold text-slate-900">Rp {(unitPrice).toLocaleString()}</span>
                        </div>
                    </div>

                    {savedItems.length > 0 && (
                        <div className="border-t border-slate-200 pt-3 mt-1 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Item</p>
                            {savedItems.map((item) => (
                                <div key={item.id} className="group flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="truncate pr-2">
                                        <p className="font-bold text-slate-700 text-[11px] truncate">{item.productName}</p>
                                        <p className="text-[10px] text-slate-400">{item.windows.length} Jendela • {item.railType}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-emerald-600 text-xs">Rp{item.itemTotalPrice.toLocaleString()}</p>
                                        <button
                                            onClick={() => removeItemFromList(item.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={addItemToList}
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                    >
                        <Plus className="h-4 w-4" />
                        Simpan ke Daftar
                    </Button>

                    <Button onClick={handleCreateInvoice} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/50 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-95">
                        <Printer className="h-5 w-5" />
                        Buat Invoice
                    </Button>
                </div>

                <p className="text-[10px] text-slate-400 italic text-center leading-relaxed">
                    *Harga sudah termasuk pemasangan
                </p>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <div className="mb-6 flex items-center gap-4">
                <Button onClick={onBack} variant="ghost" size="icon" className="hover:bg-slate-200/50 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <h3 className="text-lg font-bold text-slate-800">Kalkulator Gorden RS</h3>
            </div>

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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Grid className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-base sm:text-lg">Ukuran Bidang</h2>
                            </div>
                            <Button onClick={addWindow} size="sm" variant="outline" className="text-[11px] sm:text-xs h-7 sm:h-8 gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800">
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
                                    "h-auto min-h-[4rem] sm:h-24 px-4 sm:px-6 py-3 sm:py-0 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                    fabricType === "antibakteri"
                                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="font-bold text-sm sm:text-lg">Anti Bakteri (Polyester)</span>
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Standar Kebersihan Tinggi</span>
                                {fabricType === "antibakteri" && <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 text-emerald-500"><CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /></div>}
                            </button>

                            <button
                                onClick={() => setFabricType("antidarah")}
                                className={cn(
                                    "h-auto min-h-[4rem] sm:h-24 px-4 sm:px-6 py-3 sm:py-0 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                    fabricType === "antidarah"
                                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="font-bold text-sm sm:text-lg">Anti Darah (PVC)</span>
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Mudah Dibersihkan & Steril</span>
                                {fabricType === "antidarah" && <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 text-emerald-500"><CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /></div>}
                            </button>
                        </div>
                    </section>

                    {/* 3. Pilihan Rel */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Layers className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Pilihan Rel & Aksesoris</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setRailType("flexy")}
                                className={cn(
                                    "h-auto min-h-[4rem] sm:h-24 px-4 sm:px-6 py-3 sm:py-0 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                    railType === "flexy"
                                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <span className={cn("font-bold text-base sm:text-lg", railType === "flexy" ? "text-emerald-800" : "text-slate-800")}>Rel Flexy</span>
                                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Fleksibel & Bisa Melengkung</span>
                                {railType === "flexy" && <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 text-emerald-500"><CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /></div>}
                            </button>

                            <button
                                onClick={() => setRailType("standar")}
                                className={cn(
                                    "h-auto min-h-[4rem] sm:h-24 px-4 sm:px-6 py-3 sm:py-0 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                    railType === "standar"
                                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <span className={cn("font-bold text-base sm:text-lg", railType === "standar" ? "text-emerald-800" : "text-slate-800")}>Rel Standar</span>
                                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Lurus & Kokoh</span>
                                {railType === "standar" && <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 text-emerald-500"><CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /></div>}
                            </button>
                        </div>

                        {/* Connecting Pipe Sub-section - Automated */}
                        <div className="mt-6 pt-6 border-t border-slate-100 italic text-[10px] text-slate-400">
                            *Sistem otomatis menyertakan Connecting Pipe 35-60cm sesuai standar plafon 3m.
                        </div>
                    </section>

                    {/* 4. Upload Foto */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Upload className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Hasil Survey & Foto</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Upload Kode Gorden - Renamed for RS */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Kode Kain / Katalog</label>
                                {kodeGordenPreview ? (
                                    <div className="relative group">
                                        <img src={kodeGordenPreview} alt="Kode Kain" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
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

                            {/* Upload Motif Gorden - Renamed for RS */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Warna / Motif Kain</label>
                                {motifGordenPreview ? (
                                    <div className="relative group">
                                        <img src={motifGordenPreview} alt="Motif Kain" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
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


        </div>
    );
}
