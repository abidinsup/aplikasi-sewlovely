"use client";

import * as React from "react";
import { ArrowLeft, RefreshCw, Grid, Layers, Building2, Trash2, Printer, Plus, CheckCircle2, Upload, Image as ImageIcon, ShoppingBag } from "lucide-react";
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

export default function SurveyCalculatorKantor({ survey, onBack }: SurveyCalculatorProps) {
    const router = useRouter();

    // State
    const [customerInfo, setCustomerInfo] = React.useState({
        name: survey.customer_name || "",
        phone: survey.customer_phone || "",
        address: survey.customer_address || ""
    });

    // Current input state
    const [windows, setWindows] = React.useState([{ id: 1, width: "", height: "" }]);
    const [blindType, setBlindType] = React.useState<"vertical" | "roller" | "venetian">("roller");

    // NEW Product Selection States
    const [selectedProductId, setSelectedProductId] = React.useState<string>("custom");
    const [manualProductName, setManualProductName] = React.useState("");
    const [manualPrice, setManualPrice] = React.useState<string>("");
    const [selectedUnit, setSelectedUnit] = React.useState("per m2");

    // Saved items (the "Basket")
    const [savedItems, setSavedItems] = React.useState<any[]>([]);

    const [surveyDate] = React.useState<string | null>(survey.survey_date);
    const [surveyTime] = React.useState<string | null>(survey.survey_time);
    const [totalPrice, setTotalPrice] = React.useState(0);
    const [unitPrice, setUnitPrice] = React.useState(0);
    const [prices, setPrices] = React.useState<Product[]>([]);

    // Initialize previews with survey photos if available
    const [kodeGordenPreview, setKodeGordenPreview] = React.useState<string | null>(survey.kode_gorden_url || null);
    const [motifGordenPreview, setMotifGordenPreview] = React.useState<string | null>(survey.motif_gorden_url || null);

    React.useEffect(() => {
        const fetchPrices = async () => {
            const result = await getProducts();
            if (result.success && result.data) {
                // Filter only Kantor products or generic ones
                const officeProducts = result.data.filter(p =>
                    p.category.toLowerCase() === 'kantor' ||
                    p.name.toLowerCase().includes('blind')
                );
                setPrices(officeProducts);
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

    const handleProductChange = (val: string) => {
        setSelectedProductId(val);
        if (val === "custom") {
            setManualProductName("");
            setManualPrice("");
            setSelectedUnit("per m2");
        } else {
            const product = prices.find(p => p.id.toString() === val);
            if (product) {
                setManualProductName(product.name);
                setManualPrice(product.price.toString());
                setSelectedUnit(product.unit || "per m2");

                // Auto-detect blind type for metadata consistency
                const name = product.name.toLowerCase();
                if (name.includes("roller")) setBlindType("roller");
                else if (name.includes("vertical")) setBlindType("vertical");
                else if (name.includes("venetian")) setBlindType("venetian");
            }
        }
    };

    const addItemToList = () => {
        // Validation for current input
        const areWindowsComplete = windows.every(w => w.width && w.height);
        if (!areWindowsComplete) {
            toast.warning("Lengkapi ukuran jendela dahulu");
            return;
        }

        if (!manualProductName) {
            toast.warning("Masukkan Nama Produk / Tipe Blind");
            return;
        }

        const priceToUse = parseFloat(manualPrice) || 0;
        if (priceToUse <= 0) {
            toast.warning("Masukkan harga satuan yang valid");
            return;
        }

        const itemCalculatedPrice = windows.reduce((acc, curr) => {
            const w_m = (Number(curr.width) || 0) / 100;
            const h_m = (Number(curr.height) || 0) / 100;

            if (selectedUnit === "per m") {
                // Meter Lari: Hanya Lebar (Min 1m)
                return acc + (Math.max(1, w_m) * priceToUse);
            } else {
                // Meter Persegi: Lebar x Tinggi (Min 1m per sisi khusus Kantor)
                const area = (Math.max(1, w_m)) * (Math.max(1, h_m));
                return acc + (area * priceToUse);
            }
        }, 0);

        const newItem = {
            id: Date.now().toString(),
            productName: manualProductName,
            blindType: blindType, // Still keep for metadata
            windows: [...windows],
            unitPrice: priceToUse,
            unit: selectedUnit,
            itemTotalPrice: itemCalculatedPrice
        };

        setSavedItems([...savedItems, newItem]);

        // Reset inputs
        setWindows([{ id: Date.now(), width: "", height: "" }]);
        setManualProductName("");
        setManualPrice("");
        setSelectedProductId("custom");
        toast.success(`Berhasil menambah ${manualProductName} ke daftar`);
    };

    const removeItemFromList = (id: string) => {
        setSavedItems(savedItems.filter(item => item.id !== id));
    };

    const handleCreateInvoice = async () => {
        // Validation
        const isCustomerInfoComplete = customerInfo.name && customerInfo.phone && customerInfo.address;

        if (!isCustomerInfoComplete) {
            toast.warning("Mohon lengkapi data pemesan");
            return;
        }

        let finalItems = [...savedItems];
        const areCurrentWindowsComplete = windows.some(w => w.width && w.height);

        // If there's pending input not yet added to list, process it
        if (areCurrentWindowsComplete && windows.every(w => w.width && w.height) && manualProductName && parseFloat(manualPrice) > 0) {
            const priceToUse = parseFloat(manualPrice);
            const itemCalculatedPrice = windows.reduce((acc, curr) => {
                const w_m = (Number(curr.width) || 0) / 100;
                const h_m = (Number(curr.height) || 0) / 100;

                if (selectedUnit === "per m") {
                    return acc + (Math.max(1, w_m) * priceToUse);
                } else {
                    const area = (Math.max(1, w_m)) * (Math.max(1, h_m));
                    return acc + (area * priceToUse);
                }
            }, 0);

            finalItems.push({
                id: "current-" + Date.now(),
                productName: manualProductName,
                blindType: blindType,
                windows: [...windows],
                unitPrice: priceToUse,
                unit: selectedUnit,
                itemTotalPrice: itemCalculatedPrice
            });
        }

        if (finalItems.length === 0) {
            toast.warning("Daftar pesanan masih kosong. Gunakan tombol 'Simpan ke Daftar'.");
            return;
        }

        // Admin creates invoices directly
        const orderData = {
            customerInfo,
            savedItems: finalItems,
            totalPrice: finalItems.reduce((acc, item) => acc + item.itemTotalPrice, 0),
            surveyDate,
            surveyTime,
            partner_id: survey.partner_id,
            affiliateCode: survey.partner_id ? "PARTNER" : "ADMIN",
            kodeGordenPhoto: kodeGordenPreview,
            motifGordenPhoto: motifGordenPreview,
            survey_id: survey.id,
        };
        const encodedData = btoa(JSON.stringify(orderData));
        router.push(`/admin/calculator/kantor/invoice?data=${encodedData}`);
    };

    // Calculation Logic for UI progress only
    React.useEffect(() => {
        // Sum of saved items
        const savedTotal = savedItems.reduce((acc, item) => acc + item.itemTotalPrice, 0);

        // Current progress
        const currentPrice = parseFloat(manualPrice) || 0;
        const currentProgressTotal = windows.reduce((acc, curr) => {
            const w_m = (Number(curr.width) || 0) / 100;
            const h_m = (Number(curr.height) || 0) / 100;

            if (w_m > 0 && (selectedUnit === "per m" || h_m > 0)) {
                if (selectedUnit === "per m") {
                    return acc + (Math.max(1, w_m) * currentPrice);
                } else {
                    const area = (Math.max(1, w_m)) * (Math.max(1, h_m));
                    return acc + (area * currentPrice);
                }
            }
            return acc;
        }, 0);

        setTotalPrice(savedTotal + currentProgressTotal);
    }, [windows, manualPrice, savedItems]);

    const SummaryCard = ({ isMobile = false }) => (
        <div className={cn(
            "bg-white border-slate-200",
            isMobile ? "max-w-md mx-auto space-y-4" : "p-6 xl:p-8 rounded-[2rem] border shadow-xl shadow-slate-200/50 space-y-6 sticky top-8"
        )}>
            {!isMobile && (
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-600 rounded-lg text-white shadow-md shadow-emerald-100"><ShoppingBag className="h-4 w-4" /></div>
                    <h3 className="font-extrabold text-slate-800 text-base tracking-tight italic">Survey Summary</h3>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estimasi Total</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-400">Rp</span>
                        <h3 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight">
                            {totalPrice.toLocaleString("id-ID")}
                        </h3>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                    {savedItems.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5">Item List</p>
                            <div className="max-h-[200px] xl:max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                {savedItems.map((item) => (
                                    <div key={item.id} className="group/item flex justify-between items-center gap-2 bg-white p-3 rounded-xl border border-slate-100/80 hover:border-emerald-200 transition-all shadow-sm">
                                        <div className="truncate">
                                            <p className="font-bold text-[11px] text-slate-700 truncate">{item.productName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                {item.windows.length} Jendela • Rp{item.unitPrice.toLocaleString()} / {item.unit === 'per m2' ? 'm²' : item.unit === 'per m' ? 'm' : item.unit}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-2 shrink-0">
                                            <p className="font-bold text-xs text-emerald-600 italic">Rp{item.itemTotalPrice.toLocaleString("id-ID")}</p>
                                            <button
                                                onClick={() => removeItemFromList(item.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 mt-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Current Input</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-700 bg-white border border-slate-100 px-2 py-0.5 rounded-full">{windows.filter(w => w.width && w.height).length} Jendela</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={addItemToList}
                        className="w-full h-12 md:h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-tight flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100 group"
                    >
                        <Plus className="h-4 w-4 shrink-0 group-hover:rotate-90 transition-transform" />
                        <span className="truncate">SIMPAN KE DAFTAR</span>
                    </Button>

                    <Button
                        onClick={handleCreateInvoice}
                        className="w-full h-14 md:h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm md:text-base shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 group"
                    >
                        <Printer className="h-5 w-5 shrink-0 group-hover:animate-bounce" />
                        <span className="truncate">CETAK INVOICE</span>
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-medium italic">
                        *Sudah termasuk jasa pasang & survey
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 xl:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={onBack}
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-2xl hover:bg-slate-50 border-slate-200 transition-all active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kalkulator Gorden Kantor</h1>
                            <p className="text-sm text-slate-500 font-medium">Hitung estimasi harga blind dengan akurat</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><RefreshCw className="h-4 w-4 text-emerald-600" /></div>
                        <div className="pr-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Terakhir</p>
                            <p className="text-xs font-black text-slate-700">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-8">
                        {/* 0. Data Pemesan */}
                        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 shadow-inner"><Building2 className="h-6 w-6" /></div>
                                <div>
                                    <h2 className="font-black text-slate-900 text-xl tracking-tight leading-none">Data Pemesan</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1.5 italic">Informasi kontak & lokasi pemasangan</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap</label>
                                    <Input
                                        placeholder="Nama Pemesan"
                                        className="h-12 bg-slate-50/50 border-slate-100 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300 font-medium"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">No. WhatsApp</label>
                                    <Input
                                        placeholder="085159..."
                                        className="h-12 bg-slate-50/50 border-slate-100 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300 font-medium"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Alamat Pemasangan</label>
                                    <Input
                                        placeholder="Alamat Lengkap Kantor / Lokasi Pemasangan"
                                        className="h-12 bg-slate-50/50 border-slate-100 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300 font-medium"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 1. Ukuran Jendela */}
                        <section className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm border border-emerald-100"><Grid className="h-5 w-5" /></div>
                                    <div>
                                        <h2 className="font-bold text-slate-900 text-lg leading-none">Ukuran Jendela</h2>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Input lebar & tinggi jendela</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={addWindow}
                                    size="sm"
                                    className="w-full sm:w-auto h-11 px-6 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-tight transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> TAMBAH JENDELA
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {windows.map((window, index) => (
                                    <div key={window.id} className={cn(
                                        "group relative p-6 rounded-2xl border transition-all duration-300",
                                        windows.length > 1
                                            ? "bg-slate-50/40 border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5"
                                            : "bg-transparent border-transparent p-0"
                                    )}>
                                        {windows.length > 1 && (
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 flex items-center justify-center bg-emerald-600 text-white text-[10px] font-bold rounded-full">{index + 1}</span>
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Jendela</span>
                                                </div>
                                                <button
                                                    onClick={() => removeWindow(window.id)}
                                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                                                    title="Hapus Jendela"
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-2.5 text-center sm:text-left">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Lebar (cm)</label>
                                                <div className="relative group/input">
                                                    <Input
                                                        type="number"
                                                        placeholder="100"
                                                        className="h-16 bg-white border-slate-200 focus-visible:ring-emerald-500 text-center text-2xl font-black text-slate-800 rounded-2xl transition-all shadow-sm group-hover/input:border-emerald-400 group-hover/input:shadow-emerald-100"
                                                        value={window.width}
                                                        onChange={(e) => updateWindow(window.id, 'width', e.target.value)}
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-black group-focus-within/input:text-emerald-500 transition-colors uppercase">cm</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 text-center sm:text-left">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tinggi (cm)</label>
                                                <div className="relative group/input">
                                                    <Input
                                                        type="number"
                                                        placeholder="150"
                                                        className="h-16 bg-white border-slate-200 focus-visible:ring-emerald-500 text-center text-2xl font-black text-slate-800 rounded-2xl transition-all shadow-sm group-hover/input:border-emerald-400 group-hover/input:shadow-emerald-100"
                                                        value={window.height}
                                                        onChange={(e) => updateWindow(window.id, 'height', e.target.value)}
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-black group-focus-within/input:text-emerald-500 transition-colors uppercase">cm</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 2. Pilih Produk & Harga */}
                        <section className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 shadow-sm border border-purple-100"><Layers className="h-5 w-5" /></div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg leading-none">Pilihan Produk & Harga</h2>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Tentukan tipe & harga jual</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Cari dari Katalog</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-12 bg-slate-50 border-slate-200 hover:border-purple-300 transition-all rounded-xl px-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none cursor-pointer"
                                            value={selectedProductId}
                                            onChange={(e) => handleProductChange(e.target.value)}
                                        >
                                            <option value="custom">-- Input Manual / Harga Custom --</option>
                                            {prices.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (Rp {p.price.toLocaleString()} /{p.unit === 'per m2' ? 'm²' : p.unit === 'per m' ? 'm' : p.unit})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {selectedProductId === "custom" && (
                                    <>
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipe / Kategori</label>
                                            <div className="flex p-1.5 bg-slate-100 rounded-xl gap-1">
                                                {(['roller', 'vertical', 'venetian'] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setBlindType(type)}
                                                        className={cn(
                                                            "flex-1 py-2 px-1 rounded-lg text-[9px] xl:text-[10px] font-black uppercase transition-all duration-300 truncate",
                                                            blindType === type
                                                                ? "bg-emerald-600 text-white shadow-md scale-100"
                                                                : "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                        )}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nama Produk (di Invoice)</label>
                                            <Input
                                                placeholder="Contoh: Roller Blind Blackout Seri SP.20"
                                                className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl font-bold text-slate-700"
                                                value={manualProductName}
                                                onChange={(e) => setManualProductName(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Harga Jual / Satuan (Rp)</label>
                                    <div className="relative group/price">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl font-black text-slate-800 pr-20 transition-all border-l-4 border-l-emerald-500"
                                            value={manualPrice}
                                            onChange={(e) => setManualPrice(e.target.value)}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-1 rounded-lg border",
                                                selectedUnit === "per m2" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    selectedUnit === "per m" ? "bg-amber-50 text-amber-600 border-amber-200 underline decoration-2" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                            )}>
                                                {selectedUnit === "per m2" ? "/ M²" : selectedUnit === "per m" ? "/ M" : "/ PCS"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic pl-1 flex items-center gap-1.5 mt-2">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                            selectedUnit === "per m" ? "bg-amber-400" : "bg-emerald-400"
                                        )} />
                                        {selectedUnit === "per m"
                                            ? "Peringatan: Produk ini dihitung per Meter Lari (Tinggi diabaikan)"
                                            : "Dihitung per Meter Persegi (Lebar x Tinggi)"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Upload Foto */}
                        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-inner"><Upload className="h-6 w-6" /></div>
                                <div>
                                    <h2 className="font-black text-slate-900 text-xl tracking-tight leading-none">Foto & Kelengkapan</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1.5 italic">Dokumentasi survey lapangan</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="group space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Foto Kode Blind</label>
                                    {kodeGordenPreview ? (
                                        <div className="relative group/img overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
                                            <img src={kodeGordenPreview} alt="Kode Blind" className="w-full h-48 object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105">
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setKodeGordenPreview(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                    GANTI FOTO
                                                </label>
                                                <button
                                                    onClick={() => setKodeGordenPreview(null)}
                                                    className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-105"
                                                >
                                                    HAPUS
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
                                            <div className="h-48 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50 transition-all group/upload">
                                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover/upload:scale-110 transition-transform"><Upload className="h-6 w-6 text-slate-400 group-hover/upload:text-blue-500" /></div>
                                                <div className="text-center">
                                                    <span className="block text-xs font-black text-slate-600 tracking-tight">Upload Foto Kode</span>
                                                    <span className="block text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">JPG, PNG up to 5MB</span>
                                                </div>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                <div className="group space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Foto Tekstur / Kain</label>
                                    {motifGordenPreview ? (
                                        <div className="relative group/img overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
                                            <img src={motifGordenPreview} alt="Motif Gorden" className="w-full h-48 object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105">
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setMotifGordenPreview(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                    GANTI FOTO
                                                </label>
                                                <button
                                                    onClick={() => setMotifGordenPreview(null)}
                                                    className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-red-600 hover:text-white transition-all transform hover:scale-105"
                                                >
                                                    HAPUS
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
                                            <div className="h-48 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50 transition-all group/upload">
                                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover/upload:scale-110 transition-transform"><ImageIcon className="h-6 w-6 text-slate-400 group-hover/upload:text-blue-500" /></div>
                                                <div className="text-center">
                                                    <span className="block text-xs font-black text-slate-600 tracking-tight">Upload Foto Kain</span>
                                                    <span className="block text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">JPG, PNG up to 5MB</span>
                                                </div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN - SUMMARY */}
                    <div className="lg:col-span-4 rounded-3xl h-full">
                        <SummaryCard />
                    </div>
                </div>
            </div>
        </div>
    );
}
