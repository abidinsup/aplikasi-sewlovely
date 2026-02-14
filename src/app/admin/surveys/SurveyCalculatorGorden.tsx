"use client";

import * as React from "react";
import { RefreshCw, Building2, Layers, Grid, Link as LinkIcon, Printer, CheckCircle2, Plus, Trash2, Upload, Image as ImageIcon, ArrowLeft, Bed, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getProducts, Product } from "@/lib/products";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SurveyCalculatorProps {
    survey: any;
    onBack: () => void;
}

interface OtherItem {
    id: string; // 'sprei' | 'bedcover'
    name: string;
    price: number;
    quantity: number;
    notes: string;
}

export default function SurveyCalculatorGorden({ survey, onBack }: SurveyCalculatorProps) {
    const router = useRouter();

    // State
    const [customerInfo, setCustomerInfo] = React.useState({
        name: survey.customer_name || "",
        phone: survey.customer_phone || "",
        address: survey.customer_address || ""
    });
    const [windows, setWindows] = React.useState([{ id: 1, width: "", height: "" }]);
    const [motifCode, setMotifCode] = React.useState("");
    const [surveyDate] = React.useState<string | null>(survey.survey_date);
    const [surveyTime] = React.useState<string | null>(survey.survey_time);
    const [fabric, setFabric] = React.useState<"blackout" | "dimout">("blackout");
    const [useVitrace, setUseVitrace] = React.useState(false);
    const [model, setModel] = React.useState<"smokering" | "cantel">("smokering");
    const [totalPrice, setTotalPrice] = React.useState(0);
    const [unitPrice, setUnitPrice] = React.useState(0);
    const [prices, setPrices] = React.useState<Product[]>([]);

    // Other Items State
    const [otherItems, setOtherItems] = React.useState<OtherItem[]>([]);

    // Initialize previews with survey photos if available
    const [kodeGordenPreview, setKodeGordenPreview] = React.useState<string | null>(survey.kode_gorden_url || null);
    const [motifGordenPreview, setMotifGordenPreview] = React.useState<string | null>(survey.motif_gorden_url || null);

    const fetchPrices = async (showToast = false) => {
        const result = await getProducts();
        if (result.success && result.data) {
            setPrices(result.data);
            if (showToast) {
                toast.success("Data harga diperbarui");
            }
        }
    };

    React.useEffect(() => {
        fetchPrices(false);
        // Cleanup legacy items from HMR/State persistence
        setOtherItems(prev => prev.filter(item => item.id !== 'sprei' && item.id !== 'bedcover'));
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

    // Other Items Handlers
    const toggleOtherItem = (id: string, name: string) => {
        const exists = otherItems.find(item => item.id === id);
        if (exists) {
            setOtherItems(otherItems.filter(item => item.id !== id));
        } else {
            // Find specific price from products
            const product = prices.find(p => p.name.toLowerCase() === name.toLowerCase());
            const basePrice = product ? product.price : 0;

            setOtherItems([...otherItems, {
                id, // Use name as ID for uniqueness
                name,
                price: basePrice,
                quantity: 1,
                notes: ""
            }]);
        }
    };

    const updateOtherItem = (id: string, field: keyof OtherItem, value: any) => {
        setOtherItems(otherItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const [isUpdatingCustomer, setIsUpdatingCustomer] = React.useState(false);

    const handleUpdateCustomer = async () => {
        if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
            toast.error("Mohon lengkapi data pemesan");
            return;
        }

        setIsUpdatingCustomer(true);
        try {
            const { error } = await supabase
                .from('survey_schedules')
                .update({
                    customer_name: customerInfo.name,
                    customer_phone: customerInfo.phone,
                    customer_address: customerInfo.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', survey.id);

            if (error) throw error;
            toast.success("Data pemesan berhasil diperbarui");
        } catch (err) {
            console.error("Error updating customer:", err);
            toast.error("Gagal memperbarui data pemesan");
        } finally {
            setIsUpdatingCustomer(false);
        }
    };

    const handleCreateInvoice = async () => {
        // Validation
        const isCustomerInfoComplete = customerInfo.name && customerInfo.phone && customerInfo.address;
        const areWindowsComplete = windows.every(w => w.width && w.height);

        if (!isCustomerInfoComplete || !areWindowsComplete) {
            toast.warning("Mohon semua data dilengkapi");
            return;
        }

        // Validate no zero values (only for windows)
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

        // Create Invoice Data
        const orderData = {
            customerInfo,
            windows,
            motifCode,
            fabric,
            useVitrace,
            model,
            totalPrice,
            unitPrice,
            surveyDate,
            surveyTime,
            partner_id: survey.partner_id, // Link to partner
            affiliateCode: survey.partner_id ? "PARTNER" : "ADMIN",
            kodeGordenPhoto: kodeGordenPreview,
            motifGordenPhoto: motifGordenPreview,
            survey_id: survey.id,
            otherItems: otherItems, // Include other items
        };
        const encodedData = btoa(JSON.stringify(orderData));
        // Push WITHOUT &mode=simulasi so it saves to DB
        router.push(`/admin/calculator/gorden/invoice?data=${encodedData}`);
    };

    // Calculation Logic
    React.useEffect(() => {
        if (prices.length === 0) return;

        const packageBlackout = prices.find(p => p.name.toUpperCase().includes("BLACKOUT"))?.price || 0;
        const packageDimout = prices.find(p => p.name.toUpperCase().includes("DIMOUT"))?.price || 0;
        const packageVitrace = prices.find(p => p.name.toUpperCase().includes("VITRACE"))?.price || 0;

        let basePackagePrice = fabric === "blackout" ? packageBlackout : packageDimout;
        let vitracePrice = useVitrace ? packageVitrace : 0;

        const windowsTotal = windows.reduce((acc, curr) => {
            const w = Number(curr.width) || 0;
            const h = Number(curr.height) || 0;
            if (w > 0 && h > 0) {
                const area = Math.max(1, w * h);
                const pricePerArea = basePackagePrice + vitracePrice;
                if (pricePerArea !== unitPrice) setUnitPrice(pricePerArea);
                return acc + (area * pricePerArea);
            }
            return acc;
        }, 0);

        const otherItemsTotal = otherItems.reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);

        setTotalPrice(windowsTotal + otherItemsTotal);
    }, [windows, fabric, useVitrace, prices, otherItems]);

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

                <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 hidden lg:block">
                    <div className="flex justify-between">
                        <span>Jendela</span>
                        <span className="font-bold">{windows.length} Set</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Jenis Paket</span>
                        <span className="font-bold capitalize">{fabric} + Pipa</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Model</span>
                        <span className="font-bold capitalize">{model}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Vitrace</span>
                        <span className="font-bold">{useVitrace ? 'Ya' : 'Tidak'}</span>
                    </div>
                    {otherItems.length > 0 && (
                        <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                            <span className="block text-xs font-bold text-slate-400 uppercase">Produk Lainnya</span>
                            {otherItems.map(item => (
                                <div key={item.id} className="flex justify-between text-xs">
                                    <span>{item.name} ({item.quantity}x)</span>
                                    <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <div className="mb-6 flex items-center gap-4">
                <Button onClick={onBack} variant="ghost" size="icon" className="hover:bg-slate-200/50 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <h3 className="text-lg font-bold text-slate-800">Kalkulator Gorden Rumah</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT COLUMN - FORM INPUTS */}
                <div className="lg:col-span-8 space-y-8">
                    {/* 0. Data Pemesan */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Data Pemesan</h2>
                            </div>
                            <Button
                                onClick={handleUpdateCustomer}
                                disabled={isUpdatingCustomer}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                            >
                                {isUpdatingCustomer ? (
                                    <>Processing...</>
                                ) : (
                                    <>Simpan Perubahan</>
                                )}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Nama Lengkap</label>
                                <Input
                                    placeholder="Nama Pemesan"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">No. WhatsApp</label>
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
                                    placeholder="Jl. Contoh No. 123, Jakarta Selatan"
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
                                <h2 className="font-bold text-slate-900 text-lg">Ukuran Jendela</h2>
                            </div>
                            <Button onClick={addWindow} size="sm" variant="outline" className="text-xs h-8 gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800">
                                <Plus className="h-3 w-3" /> Tambah Jendela
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {windows.map((window, index) => (
                                <div key={window.id} className={cn("relative p-4 rounded-2xl border transition-all", windows.length > 1 ? "bg-slate-50/50 border-slate-200" : "bg-transparent border-transparent p-0")}>
                                    {windows.length > 1 && (
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Jendela {index + 1}</span>
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
                                                    placeholder="2.4"
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
                                                    placeholder="2.8"
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
                                onClick={() => setFabric("blackout")}
                                className={cn(
                                    "h-24 px-6 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                    fabric === "blackout"
                                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <span className={cn("font-bold text-lg", fabric === "blackout" ? "text-emerald-800" : "text-slate-800")}>Blackout</span>
                                <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Blokir 100% Cahaya</span>
                                {fabric === "blackout" && <div className="absolute top-1/2 -translate-y-1/2 right-6 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>}
                            </button>

                            <button
                                onClick={() => setFabric("dimout")}
                                className={cn(
                                    "h-24 px-6 rounded-2xl border-2 flex flex-col items-start justify-center gap-1 transition-all duration-300 text-left relative overflow-hidden",
                                    fabric === "dimout"
                                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <span className={cn("font-bold text-lg", fabric === "dimout" ? "text-emerald-800" : "text-slate-800")}>Dimout</span>
                                <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Blokir 80% Cahaya</span>
                                {fabric === "dimout" && <div className="absolute top-1/2 -translate-y-1/2 right-6 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>}
                            </button>
                        </div>

                        {/* Vitrace Toggle */}
                        <div className={cn(
                            "flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer mt-4",
                            useVitrace ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 bg-white hover:border-slate-200"
                        )} onClick={() => setUseVitrace(!useVitrace)}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-colors",
                                    useVitrace ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                )}>
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="font-bold text-base text-slate-800 block">Tambahkan Vitrace</span>
                                    <span className="text-xs text-slate-500">Lapisan tipis tembus pandang untuk siang hari</span>
                                </div>
                            </div>
                            <div className={cn(
                                "w-14 h-8 rounded-full transition-all duration-300 relative border",
                                useVitrace ? "bg-emerald-500 border-emerald-600" : "bg-slate-200 border-slate-300"
                            )}>
                                <div className={cn(
                                    "absolute top-1/2 -translate-y-1/2 h-6 w-6 bg-white rounded-full shadow-sm transition-all duration-300",
                                    useVitrace ? "left-[calc(100%-26px)]" : "left-[2px]"
                                )}></div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Model & Foto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Model Gorden */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><LinkIcon className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Model Gorden</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setModel("smokering")}
                                    className={cn(
                                        "h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300",
                                        model === "smokering"
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                            : "bg-white border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <Grid className={cn("h-8 w-8", model === "smokering" ? "text-emerald-600" : "text-slate-400")} />
                                    <span className={cn("text-sm font-bold", model === "smokering" ? "text-emerald-700" : "text-slate-500")}>Smokering</span>
                                </button>

                                <button
                                    onClick={() => setModel("cantel")}
                                    className={cn(
                                        "h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300",
                                        model === "cantel"
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                            : "bg-white border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    <LinkIcon className={cn("h-8 w-8", model === "cantel" ? "text-emerald-600" : "text-slate-400")} />
                                    <span className={cn("text-sm font-bold", model === "cantel" ? "text-emerald-700" : "text-slate-500")}>Cantel</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* 4. Produk Lainnya (Sprei & Bedcover) */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Bed className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Pilih Ukuran Sprei</h2>
                            <span className="text-xs text-slate-500 ml-auto">Bahan Premium Cotton</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { name: 'Sprei Single Small', size: '90x200' },
                                { name: 'Sprei Single', size: '100x200' },
                                { name: 'Sprei Double', size: '120x200' },
                                { name: 'Sprei Queen', size: '160x200' },
                                { name: 'Sprei King', size: '180x200' },
                                { name: 'Sprei Extra King', size: '200x200' },
                            ].map((item) => {
                                const fullName = `${item.name} (${item.size})`;
                                const isSelected = otherItems.some(i => i.name === fullName);
                                const itemPrice = prices.find(p => p.name.toLowerCase() === fullName.toLowerCase())?.price || 0;

                                return (
                                    <div
                                        key={item.size}
                                        onClick={() => toggleOtherItem(fullName, fullName)}
                                        className={cn(
                                            "cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:shadow-md",
                                            isSelected
                                                ? "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                                                : "bg-white border-slate-100 hover:border-emerald-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={cn("font-bold text-sm", isSelected ? "text-emerald-800" : "text-slate-800")}>
                                                {item.name} <span className="text-xs font-normal text-slate-500 block mt-0.5">({item.size})</span>
                                            </h3>
                                            {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                        </div>
                                        <p className={cn("font-bold text-sm", isSelected ? "text-emerald-600" : "text-emerald-600")}>
                                            Rp {itemPrice.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><BedDouble className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-lg">Pilih Bedcover (Opsional)</h2>
                                <span className="text-xs text-slate-500 ml-auto">Isian Silicon Lembut</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { name: 'Bedcover Super Single', size: '150x230' },
                                    { name: 'Bedcover Queen', size: '200x200' },
                                    { name: 'Bedcover King', size: '220x230' },
                                    { name: 'Bedcover Super King', size: '250x230' },
                                ].map((item) => {
                                    const fullName = `${item.name} (${item.size})`;
                                    const isSelected = otherItems.some(i => i.name === fullName);
                                    const itemPrice = prices.find(p => p.name.toLowerCase() === fullName.toLowerCase())?.price || 0;

                                    return (
                                        <div
                                            key={item.size}
                                            onClick={() => toggleOtherItem(fullName, fullName)}
                                            className={cn(
                                                "cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:shadow-md",
                                                isSelected
                                                    ? "bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500"
                                                    : "bg-white border-slate-100 hover:border-blue-200"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={cn("font-bold text-sm", isSelected ? "text-blue-800" : "text-slate-800")}>
                                                    {item.name} <span className="text-xs font-normal text-slate-500 block mt-0.5">({item.size})</span>
                                                </h3>
                                                {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                            </div>
                                            <p className={cn("font-bold text-sm", isSelected ? "text-blue-600" : "text-blue-600")}>
                                                Rp {itemPrice.toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* 5. Hasil Survey & Foto */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Upload className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Hasil Survey & Foto</h2>
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
            {/* Mobile Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-8 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.05)] z-30 lg:hidden">
                <SummaryCard isMobile={true} />
            </div>
        </div>
    );
}
