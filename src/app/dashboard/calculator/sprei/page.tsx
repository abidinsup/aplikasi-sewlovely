"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Bed, BedDouble, Info, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCurrentPartner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getProducts, Product } from "@/lib/products";

// Data Definitions
const SPREI_SIZES = [
    { id: 'S-90', size: '90x200', label: 'Sprei Single Small (90x200)', nameRef: 'Sprei Single Small (90x200)', price: 0 },
    { id: 'S-100', size: '100x200', label: 'Sprei Single (100x200)', nameRef: 'Sprei Single (100x200)', price: 0 },
    { id: 'S-120', size: '120x200', label: 'Sprei Double (120x200)', nameRef: 'Sprei Double (120x200)', price: 0 },
    { id: 'S-160', size: '160x200', label: 'Sprei Queen (160x200)', nameRef: 'Sprei Queen (160x200)', price: 0 },
    { id: 'S-180', size: '180x200', label: 'Sprei King (180x200)', nameRef: 'Sprei King (180x200)', price: 0 },
    { id: 'S-200', size: '200x200', label: 'Sprei Extra King (200x200)', nameRef: 'Sprei Extra King (200x200)', price: 0 },
];

const BEDCOVER_SIZES = [
    { id: 'BC-150', size: '150x230', label: 'Bedcover Super Single (150x230)', nameRef: 'Bedcover Super Single (150x230)', price: 0 },
    { id: 'BC-200', size: '200x200', label: 'Bedcover Queen (200x200)', nameRef: 'Bedcover Queen (200x200)', price: 0 },
    { id: 'BC-220', size: '220x230', label: 'Bedcover King (220x230)', nameRef: 'Bedcover King (220x230)', price: 0 },
    { id: 'BC-250', size: '250x230', label: 'Bedcover Super King (250x230)', nameRef: 'Bedcover Super King (250x230)', price: 0 },
];

export default function SpreiCalculatorPage() {
    const router = useRouter();

    // State
    const [customerInfo, setCustomerInfo] = React.useState({ name: "", phone: "", address: "" });
    const [selectedSpreiId, setSelectedSpreiId] = React.useState<string | null>(null);
    const [selectedBedcoverId, setSelectedBedcoverId] = React.useState<string | null>(null);
    const [prices, setPrices] = React.useState<Product[]>([]);

    // Visit Schedule State
    const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    }, []);

    // Helper to find price flexibly
    const findPrice = (items: Product[], type: string, size: string) => {
        const normalizedType = type.toLowerCase();
        const normalizedSize = size.toLowerCase();

        const exactMatch = items.find(p => {
            const name = p.name.toLowerCase();
            return name.includes(normalizedType) && name.includes(`(${normalizedSize})`);
        });

        if (exactMatch) return exactMatch.price;

        return items.find(p => {
            const name = p.name.toLowerCase();
            return name.includes(normalizedType) && name.includes(normalizedSize);
        })?.price;
    };

    // Derived Options with Dynamic Prices
    const spreiOptions = SPREI_SIZES.map(s => ({
        ...s,
        price: findPrice(prices, 'sprei', s.size) || s.price
    }));

    const bedcoverOptions = BEDCOVER_SIZES.map(b => ({
        ...b,
        price: findPrice(prices, 'bedcover', b.size) || b.price
    }));

    const selectedSprei = spreiOptions.find(s => s.id === selectedSpreiId);
    const selectedBedcover = bedcoverOptions.find(b => b.id === selectedBedcoverId);

    const totalPrice = (selectedSprei?.price || 0) + (selectedBedcover?.price || 0);

    const handleRequestVisit = async () => {
        // Validation
        const isCustomerInfoComplete = customerInfo.name && customerInfo.phone && customerInfo.address;
        const isSelectionComplete = selectedSprei || selectedBedcover;

        if (!isCustomerInfoComplete) {
            toast.warning("Mohon lengkapi data pemesan (Nama, WA, Alamat)");
            return;
        }

        if (!isSelectionComplete) {
            toast.warning("Mohon pilih setidaknya satu produk (Sprei atau Bedcover)");
            return;
        }

        // Default schedule for new sprei requests (to be arranged by admin)
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1); // Tomorrow
        const surveyDate = defaultDate.toISOString().split('T')[0];
        const surveyTime = "09:00";

        setIsSubmitting(true);
        try {
            const partner = getCurrentPartner();

            // Prepare the interest note
            const interestNote = `Minat Sprei: ${selectedSprei?.label || '-'} | Bedcover: ${selectedBedcover?.label || '-'}. Estimasi Total: Rp ${totalPrice.toLocaleString('id-ID')}`;

            // 1. Check for existing active survey for this customer phone
            const { data: existingSurvey, error: searchError } = await supabase
                .from('survey_schedules')
                .select('id, notes, status')
                .eq('customer_phone', customerInfo.phone)
                .in('status', ['pending', 'confirmed'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (existingSurvey && !searchError) {
                // Scenario A: Merge with existing survey
                const currentNotes = existingSurvey.notes || "";
                // Prevent duplicate notes if possible (simple check)
                if (!currentNotes.includes(interestNote)) {
                    const updatedNotes = currentNotes
                        ? `${currentNotes}\n\n[TAMBAHAN SPREI] ${interestNote}`
                        : `[TAMBAHAN SPREI] ${interestNote}`;

                    const { error: updateError } = await supabase
                        .from('survey_schedules')
                        .update({
                            notes: updatedNotes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingSurvey.id);

                    if (updateError) throw updateError;

                    toast.success("Permintaan Sprei berhasil digabungkan dengan jadwal survey Gorden yang sudah ada!", {
                        duration: 5000,
                    });
                } else {
                    toast.info("Permintaan ini sepertinya sudah ditambahkan sebelumnya.");
                }
            } else {
                // Scenario B: Create new survey request specifically for Sprei
                const { error: insertError } = await supabase
                    .from('survey_schedules')
                    .insert({
                        partner_id: partner?.id || null,
                        customer_name: customerInfo.name,
                        customer_phone: customerInfo.phone,
                        customer_address: customerInfo.address,
                        survey_date: surveyDate, // Default placeholder date
                        survey_time: surveyTime, // Default placeholder time
                        calculator_type: 'sprei', // Ensure database constraint allows this!
                        status: 'pending',
                        notes: `[REQUEST SPREI] ${interestNote}`
                    });

                if (insertError) throw insertError;

                toast.success("Request Sprei berhasil disimpan! Admin akan menghubungi untuk jadwal pastinya.", {
                    duration: 5000,
                });
            }

            // Redirect to survey list status
            setTimeout(() => {
                router.push('/dashboard/survey');
            }, 1000);

        } catch (err: any) {
            console.error('Error submitting request:', err);
            toast.error("Gagal memproses permintaan: " + (err.message || "Terjadi kesalahan"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const SummaryCard = ({ isMobile = false }) => (
        <div className={cn(
            "bg-white border-slate-100",
            isMobile ? "max-w-md mx-auto space-y-4" : "p-6 rounded-3xl border shadow-lg shadow-emerald-900/5 space-y-6 sticky top-24"
        )}>
            {!isMobile && <h3 className="font-bold text-slate-900 text-lg mb-4">Ringkasan Minat</h3>}

            {isMobile ? (
                <div className="max-w-md mx-auto space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estimasi Harga</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 tracking-tight truncate">
                                Rp {totalPrice.toLocaleString("id-ID")}
                            </h3>
                        </div>
                        <Button
                            onClick={handleRequestVisit}
                            disabled={(!selectedSprei && !selectedBedcover) || isSubmitting}
                            className="flex-none w-32 h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    <span>Simpan</span>
                                </div>
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                        Tim kami akan membawakan katalog motif saat survey.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-end justify-between px-2">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimasi Harga</p>
                            <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                                Rp {totalPrice.toLocaleString("id-ID")}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 hidden lg:block">
                        {selectedSprei ? (
                            <div className="flex justify-between items-start pb-2 border-b border-slate-200 border-dashed">
                                <div>
                                    <span className="font-bold text-slate-900 block">{selectedSprei.label}</span>
                                </div>
                                <span className="font-medium">Rp {selectedSprei.price.toLocaleString("id-ID")}</span>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">Belum ada sprei dipilih</p>
                        )}

                        {selectedBedcover ? (
                            <div className="flex justify-between items-start pt-1">
                                <div>
                                    <span className="font-bold text-slate-900 block">{selectedBedcover.label}</span>
                                </div>
                                <span className="font-medium">Rp {selectedBedcover.price.toLocaleString("id-ID")}</span>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">Belum ada bedcover dipilih</p>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
                        <p className="font-medium text-center">
                            Tim kami akan membawakan katalog motif saat kunjungan survey.
                        </p>
                    </div>

                    <Button
                        onClick={handleRequestVisit}
                        disabled={(!selectedSprei && !selectedBedcover) || isSubmitting}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/50 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Menyimpan...</span>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Simpan
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full h-10 w-10 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sprei & Bedcover</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-32 lg:pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN - FORM INPUTS */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 0. Data Pemesan */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <h2 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Informasi Pemesan</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Nama Lengkap</label>
                                    <Input
                                        placeholder="Nama Pelanggan"
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">No. WhatsApp</label>
                                    <Input
                                        placeholder="085159588681"
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Alamat Pengiriman</label>
                                    <Input
                                        placeholder="Alamat Lengkap..."
                                        className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 1. Pilih Sprei */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <Bed className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg">Pilih Ukuran Sprei</h2>
                                    <p className="text-xs text-slate-500">Bahan Premium Cotton</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {spreiOptions.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedSpreiId(selectedSpreiId === item.id ? null : item.id)}
                                        className={cn(
                                            "relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md",
                                            selectedSpreiId === item.id
                                                ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                                                : "bg-white border-slate-100 hover:border-emerald-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="h-2 w-2" /> {/* Spacer */}
                                            {selectedSpreiId === item.id && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm mb-1 leading-snug">{item.label}</p>
                                        <p className="text-emerald-600 font-bold text-sm">Rp {item.price.toLocaleString("id-ID")}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 2. Pilih Bedcover */}
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <BedDouble className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg">Pilih Bedcover (Opsional)</h2>
                                    <p className="text-xs text-slate-500">Isian Silicon Lembut</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {bedcoverOptions.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedBedcoverId(selectedBedcoverId === item.id ? null : item.id)}
                                        className={cn(
                                            "relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md",
                                            selectedBedcoverId === item.id
                                                ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                                                : "bg-white border-slate-100 hover:border-blue-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="h-2 w-2" /> {/* Spacer */}
                                            {selectedBedcoverId === item.id && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm mb-1 leading-snug">{item.label}</p>
                                        <p className="text-blue-600 font-bold text-sm">Rp {item.price.toLocaleString("id-ID")}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* RIGHT COLUMN - SUMMARY */}
                    <div className="hidden lg:block lg:col-span-4 rounded-3xl">
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
