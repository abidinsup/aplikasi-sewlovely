"use client";

import * as React from "react";
import { ArrowLeft, RefreshCw, Grid, Layers, Building2, Trash2, Printer, Plus, CheckCircle2, Upload, Image as ImageIcon } from "lucide-react";
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
            isMobile ? "max-w-md mx-auto space-y-4" : "p-6 rounded-3xl border shadow-lg shadow-emerald-900/5 space-y-6 sticky top-6"
        )}>
            {!isMobile && <h3 className="font-bold text-slate-900 text-lg mb-4">Ringkasan Pesanan</h3>}

            <div className="space-y-4">
                <div className="flex items-end justify-between px-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Estimasi</p>
                        <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                            Rp {totalPrice.toLocaleString("id-ID")}
                        </h3>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 hidden lg:block overflow-hidden">
                    {savedItems.length > 0 && (
                        <div className="space-y-3 mb-3 border-b border-slate-200 pb-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Item</p>
                            {savedItems.map((item, idx) => (
                                <div key={item.id} className="flex justify-between items-start gap-2 bg-white p-2 rounded-lg border border-slate-100">
                                    <div className="flex-1">
                                        <p className="font-bold text-[11px] text-slate-800 capitalize leading-tight">{item.productName}</p>
                                        <p className="text-[10px] text-slate-400">{item.windows.length} Jendela @ Rp {item.unitPrice.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[11px] text-emerald-600">Rp {item.itemTotalPrice.toLocaleString("id-ID")}</p>
                                        <button
                                            onClick={() => removeItemFromList(item.id)}
                                            className="text-[10px] text-red-400 hover:text-red-500 font-medium"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between">
                        <span>Input Saat Ini</span>
                        <span className="font-bold">{windows.filter(w => w.width && w.height).length} Jendela</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Jenis Blind</span>
                        <span className="font-bold capitalize">{blindType}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={addItemToList}
                        variant="outline"
                        className="w-full h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-2 border-2"
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
                <h3 className="text-lg font-bold text-slate-800">Kalkulator Gorden Kantor</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                    {/* 0. Data Pemesan */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Data Pemesan</h2>
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
                                    placeholder="085159..."
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Alamat Pemasangan</label>
                                <Input
                                    placeholder="Alamat Kantor"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                    value={customerInfo.address}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* 1. Pilih Produk & Harga */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Layers className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Pilihan Produk & Harga</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Cari dari Katalog</label>
                                <select
                                    className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl px-4 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    value={selectedProductId}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                >
                                    <option value="custom">-- Input Manual / Harga Custom --</option>
                                    {prices.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Rp {p.price.toLocaleString()})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Tipe / Kategori</label>
                                <div className="flex gap-2">
                                    {(['roller', 'vertical', 'venetian'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setBlindType(type)}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all",
                                                blindType === type ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Nama Produk (Muncul di Invoice)</label>
                                <Input
                                    placeholder="Contoh: Roller Blind Blackout Seri SP.20"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                                    value={manualProductName}
                                    onChange={(e) => setManualProductName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Harga Jual per m² (Rp)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-12 bg-slate-100 border-slate-200 focus-visible:ring-emerald-500 rounded-xl font-bold pr-16"
                                        value={manualPrice}
                                        onChange={(e) => setManualPrice(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">/ m²</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic pl-1">*Hapus dan ketik untuk harga custom</p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Ukuran Jendela */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Grid className="h-5 w-5" /></div>
                                <h2 className="font-bold text-slate-900 text-base sm:text-lg">Ukuran Jendela</h2>
                            </div>
                            <Button onClick={addWindow} size="sm" variant="outline" className="text-[11px] h-8 gap-1 border-emerald-200 hover:bg-emerald-50">
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Lebar (cm)</label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    placeholder="100"
                                                    className="h-14 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 text-center text-xl font-bold text-slate-700 rounded-2xl group-hover:bg-white group-hover:border-emerald-200 transition-all [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={window.width}
                                                    onChange={(e) => updateWindow(window.id, 'width', e.target.value)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-300 font-medium">cm</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Tinggi (cm)</label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    placeholder="150"
                                                    className="h-14 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 text-center text-xl font-bold text-slate-700 rounded-2xl group-hover:bg-white group-hover:border-emerald-200 transition-all [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={window.height}
                                                    onChange={(e) => updateWindow(window.id, 'height', e.target.value)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-300 font-medium">cm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
