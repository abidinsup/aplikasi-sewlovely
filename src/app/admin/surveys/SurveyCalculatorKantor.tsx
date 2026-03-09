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
        } else {
            const product = prices.find(p => p.id.toString() === val);
            if (product) {
                setManualProductName(product.name);
                setManualPrice(product.price.toString());
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
            const w_cm = Number(curr.width) || 0;
            const h_cm = Number(curr.height) || 0;
            const area = (Math.max(1, w_cm / 100)) * (Math.max(1, h_cm / 100));
            return acc + (area * priceToUse);
        }, 0);

        const newItem = {
            id: Date.now().toString(),
            productName: manualProductName,
            blindType: blindType, // Still keep for metadata
            windows: [...windows],
            unitPrice: priceToUse,
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
                const w_cm = Number(curr.width) || 0;
                const h_cm = Number(curr.height) || 0;
                const area = (Math.max(1, w_cm / 100)) * (Math.max(1, h_cm / 100));
                return acc + (area * priceToUse);
            }, 0);

            finalItems.push({
                id: "current-" + Date.now(),
                productName: manualProductName,
                blindType: blindType,
                windows: [...windows],
                unitPrice: priceToUse,
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
            const w_cm = Number(curr.width) || 0;
            const h_cm = Number(curr.height) || 0;
            if (w_cm > 0 && h_cm > 0) {
                const area = (Math.max(1, w_cm / 100)) * (Math.max(1, h_cm / 100));
                return acc + (area * currentPrice);
            }
            return acc;
        }, 0);

        setTotalPrice(savedTotal + currentProgressTotal);
    }, [windows, manualPrice, savedItems]);

    const SummaryCard = ({ isMobile = false }) => (
        <div className={cn(
            "bg-white border-slate-100",
            isMobile ? "max-w-md mx-auto space-y-4" : "p-8 rounded-[2.5rem] border shadow-2xl shadow-emerald-900/10 space-y-8 sticky top-10"
        )}>
            {!isMobile && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200"><ShoppingBag className="h-5 w-5" /></div>
                    <h3 className="font-bold text-slate-900 text-xl tracking-tight">Ringkasan Pesanan</h3>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">Total Estimasi</p>
                    <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/20 rounded-full blur-2xl group-hover:bg-emerald-200/40 transition-colors" />
                        <h3 className="text-4xl font-black text-emerald-600 tracking-tighter relative z-10">
                            <span className="text-xl mr-1 opacity-70">Rp</span>
                            {totalPrice.toLocaleString("id-ID")}
                        </h3>
                    </div>
                </div>

                <div className="space-y-4 text-sm text-slate-600 hidden lg:block">
                    {savedItems.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Daftar Item Terpilih</p>
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {savedItems.map((item, idx) => (
                                    <div key={item.id} className="group/item flex justify-between items-start gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all shadow-sm">
                                        <div className="flex-1">
                                            <p className="font-black text-xs text-slate-800 uppercase tracking-tight leading-none mb-1 group-hover/item:text-emerald-700">{item.productName}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded-full font-bold">{item.windows.length} Jendela</span>
                                                <span className="text-[10px] text-slate-400">@ Rp {item.unitPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <p className="font-black text-sm text-emerald-600 tracking-tight">Rp {item.itemTotalPrice.toLocaleString("id-ID")}</p>
                                            <button
                                                onClick={() => removeItemFromList(item.id)}
                                                className="w-7 h-7 flex items-center justify-center bg-white text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full border border-slate-100 transition-all"
                                                title="Hapus dari daftar"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 space-y-3 border-t border-slate-50">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Input Aktif</span>
                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{windows.filter(w => w.width && w.height).length} Jendela</span>
                        </div>
                        <div className="flex justify-between items-center px-1 text-slate-500 italic text-[11px]">
                            <span>Pemasangan & Pengiriman</span>
                            <span className="font-black text-emerald-500 uppercase not-italic">Gratis</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        onClick={addItemToList}
                        variant="outline"
                        className="w-full h-14 border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-[1.25rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/5"
                    >
                        <Plus className="h-5 w-5" />
                        Tambah Item Ke Daftar
                    </Button>

                    <Button
                        onClick={handleCreateInvoice}
                        className="w-full h-16 bg-slate-900 hover:bg-emerald-600 text-white rounded-[1.25rem] font-black text-lg shadow-xl shadow-slate-900/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 group"
                    >
                        <Printer className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                        BUAT INVOICE
                    </Button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 italic text-center leading-relaxed font-medium">
                        *Estimasi harga sudah termasuk jasa pasang & survey lokasi. Harga final dapat berubah jika ada tambahan aksesories.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <div className="mb-6 flex items-center gap-4">
                <Button onClick={onBack} variant="ghost" size="icon" className="hover:bg-slate-200/50 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <h3 className="text-lg font-bold text-slate-800">Kalkulator Gorden Kantor</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                    {/* 0. Data Pemesan */}
                    <section className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 shadow-sm border border-slate-100"><Building2 className="h-5 w-5" /></div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg leading-none">Data Pemesan</h2>
                                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">Informasi kontak pelanggan kantor</p>
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
                                variant="outline"
                                className="w-full sm:w-auto h-11 px-5 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
                            >
                                <Plus className="h-4 w-4" /> Tambah Jendela
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
                                            <option key={p.id} value={p.id}>{p.name} (Rp {p.price.toLocaleString()})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipe / Kategori</label>
                                <div className="flex p-1.5 bg-slate-100 rounded-xl gap-1">
                                    {(['roller', 'vertical', 'venetian'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setBlindType(type)}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-300",
                                                blindType === type
                                                    ? "bg-white text-emerald-700 shadow-sm border border-emerald-50 scale-100"
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

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Harga Jual / m² (Rp)</label>
                                <div className="relative group/price">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl font-black text-slate-800 pr-20 transition-all border-l-4 border-l-emerald-500"
                                        value={manualPrice}
                                        onChange={(e) => setManualPrice(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">/ M²</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic pl-1 flex items-center gap-1.5 mt-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Ketik angka untuk mengubah harga manual
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Upload Foto */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Upload className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Hasil Survey & Foto</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Kode Blind / Katalog</label>
                                {kodeGordenPreview ? (
                                    <div className="relative group">
                                        <img src={kodeGordenPreview} alt="Kode Blind" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
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
                                                Ganti
                                            </label>
                                            <button onClick={() => setKodeGordenPreview(null)} className="bg-red-500/80 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium">Hapus</button>
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

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Warna / Motif Blind</label>
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
                                                Ganti
                                            </label>
                                            <button onClick={() => setMotifGordenPreview(null)} className="bg-red-500/80 backdrop-blur px-3 py-1.5 rounded-lg text-white text-xs font-medium">Hapus</button>
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
