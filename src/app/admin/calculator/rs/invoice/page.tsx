"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAppSettings } from "@/providers/AppSettingsProvider";

function InvoiceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [data, setData] = React.useState<any>(null);
    const [status, setStatus] = React.useState<'pending' | 'paid'>('pending');
    const [invoiceNumber, setInvoiceNumber] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const { appName, bankName, bankAccountNumber, bankAccountHolder, isMounted } = useAppSettings();

    React.useEffect(() => {
        const encodedData = searchParams.get("data");
        const statusParam = searchParams.get("status");
        const existingId = searchParams.get("id");
        const existingNumber = searchParams.get("number");

        const loadInvoice = async () => {
            if (existingId) {
                setIsSaved(true);
                try {
                    const { data: inv, error } = await supabase
                        .from('invoices')
                        .select(`
                            *,
                            partners (
                                affiliate_code
                            )
                        `)
                        .eq('id', existingId)
                        .single();

                    if (error) throw error;
                    if (inv) {
                        setInvoiceNumber(inv.invoice_number);
                        setStatus(inv.payment_status);

                        // Map DB structure to page data structure
                        setData({
                            partner_id: inv.partner_id,
                            customerInfo: {
                                name: inv.customer_name,
                                phone: inv.customer_phone,
                                address: inv.customer_address
                            },
                            totalPrice: inv.total_amount,
                            survey_id: inv.survey_id,
                            // Spread details jsonb
                            ...inv.details,
                            affiliateCode: inv.partners?.affiliate_code || inv.details?.affiliateCode || "ADMIN"
                        });
                    }
                } catch (err) {
                    console.error("Error loading invoice:", err);
                    toast.error("Gagal memuat invoice");
                }
            } else if (encodedData) {
                try {
                    const decoded = JSON.parse(atob(encodedData));
                    setData(decoded);
                    // Use existing number if available, otherwise generate new one
                    const invNum = existingNumber || `INV-RS-${Date.now().toString().slice(-8)}`;
                    setInvoiceNumber(invNum);
                } catch (e) {
                    console.error("Failed to parse invoice data", e);
                }
            } else {
                // Fallback for new invoice without data
                const invNum = existingNumber || `INV-RS-${Date.now().toString().slice(-8)}`;
                setInvoiceNumber(invNum);
            }

            if (statusParam === 'paid') {
                setStatus('paid');
            }
        };

        loadInvoice();
    }, [searchParams]);

    // Function to save invoice to Supabase
    const saveInvoiceToSupabase = async () => {
        // Skip if already saved, has existing ID, or is already paid
        if (!data || isSaved || status === 'paid') return;

        // Simulasi mode: skip database save
        const mode = searchParams.get('mode');
        if (mode === 'simulasi') return;

        setIsSaving(true);
        try {
            // Admin creates invoices without partner association

            const invoiceData = {
                invoice_number: invoiceNumber,
                partner_id: data.partner_id || null,
                customer_name: data.customerInfo?.name || "Customer",
                customer_phone: data.customerInfo?.phone || null,
                customer_address: data.customerInfo?.address || null,
                invoice_type: 'rs',
                total_amount: data.totalPrice,
                payment_status: 'pending',
                survey_id: data.survey_id || null, // Add survey_id
                details: {
                    fabricType: data.fabricType,
                    railType: data.railType,
                    windows: data.windows,
                    affiliateCode: data.affiliateCode,
                    kodeGordenPhoto: data.kodeGordenPhoto,
                    motifGordenPhoto: data.motifGordenPhoto,
                }
            };

            const { error } = await supabase
                .from('invoices')
                .insert(invoiceData);

            if (error) throw error;

            setIsSaved(true);
            toast.success("Invoice tersimpan!", {
                description: "Invoice telah dikirim ke sistem"
            });
        } catch (err: any) {
            console.error("Error saving invoice:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Function to save and print invoice
    const handleSaveAndPrint = async () => {
        const customerName = data?.customerInfo?.name || "Customer";
        const originalTitle = document.title;

        const mode = searchParams.get('mode');
        document.title = mode === 'simulasi' ? `Simulasi - ${customerName}` : `Invoice - ${customerName}`;

        await saveInvoiceToSupabase();
        window.print();

        // Restore title after print dialog closes
        document.title = originalTitle;
    };



    if (!data) return <div className="p-8 text-center text-slate-500">Memuat data invoice...</div>;

    const today = new Date().toLocaleDateString("id-ID", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0 print:m-0">

            <div className="max-w-3xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <Button variant="outline" onClick={() => router.back()} className="gap-2 w-full md:w-auto">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        onClick={handleSaveAndPrint}
                        disabled={isSaving}
                        className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 flex-1 md:flex-none"
                    >
                        {isSaving ? (
                            "Menyimpan..."
                        ) : (
                            <>
                                <Printer className="h-4 w-4" /> Simpan & Cetak
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 print:shadow-none print:border-0 print:w-full print:max-w-none print:rounded-none relative">

                {status === 'paid' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[6px] border-emerald-500 text-emerald-500 font-black text-6xl px-4 py-2 opacity-30 -rotate-12 pointer-events-none select-none tracking-widest z-10 whitespace-nowrap">
                        LUNAS
                    </div>
                )}

                <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            {isMounted ? appName : "Sewlovely Homeset"}
                        </h1>
                        <p className="text-sm text-slate-500">Ciater Tengah No 99</p>
                        <p className="text-sm text-slate-500 mt-1">Tangerang Selatan</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-emerald-600 mb-1">INVOICE</h2>
                        <p className="font-mono text-sm text-slate-600">{invoiceNumber}</p>
                        <p className="font-mono text-xs text-emerald-600 mt-1">Mitra: {data.affiliateCode || "-"}</p>
                        <p className="text-sm text-slate-500 mt-1">{today}</p>
                        <div className={cn(
                            "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2",
                            status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                            {status === 'paid' ? 'Lunas' : 'Menunggu Pembayaran'}
                        </div>
                    </div>
                </div>

                <div className="mb-8 p-6 bg-slate-50 rounded-2xl print:bg-transparent print:p-0 print:mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ditagihkan Kepada</h3>
                    <p className="font-bold text-slate-900 text-lg">{data.customerInfo?.name || "Pelanggan Yth"}</p>
                    <p className="text-sm text-slate-500">{data.customerInfo?.address || "RS / Klinik"}</p>
                    <p className="text-sm text-slate-500">{data.customerInfo?.phone || ""}</p>
                </div>

                <div className="mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-100">
                                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi Item</th>
                                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Detail</th>
                                <th className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Harga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.windows.map((w: any, idx: number) => {
                                const width = Number(w.width) || 0;
                                const height = Number(w.height) || 0;
                                const area = Math.max(1, width * height);

                                return (
                                    <tr key={idx}>
                                        <td className="py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                                        <td className="py-4">
                                            <p className="font-bold text-slate-900">Paket Gorden RS (Jendela {idx + 1})</p>
                                            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                                <p>Kain: <span className="capitalize font-semibold">{data.fabricType === 'antibakteri' ? 'Anti Bakteri (Polyester)' : 'Anti Darah (PVC)'}</span></p>
                                                <p>Rel: <span className="capitalize font-semibold">{data.railType === 'flexy' ? 'Flexy' : 'Standar'}</span></p>
                                                <p className="font-medium text-emerald-600">Terhitung Paket (Bahan + Rel + Pasang)</p>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-center font-medium text-slate-700">
                                            {w.width}m x {w.height}m
                                        </td>
                                        <td className="py-4 text-sm text-right font-bold text-slate-900">
                                            Rp {(area * (data.unitPrice || 0)).toLocaleString("id-ID")}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-6 mb-8">
                    <div className="w-full md:w-1/2 space-y-3">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Jasa Pemasangan</span>
                            <span className="font-bold text-emerald-600">GRATIS</span>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                            <span className="font-bold text-slate-900">Total Harga</span>
                            <span className="text-2xl font-extrabold text-emerald-600">Rp {data.totalPrice.toLocaleString("id-ID")}</span>
                        </div>
                    </div>
                </div>

                {status === 'pending' && (
                    <div className="mb-12 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Metode Pembayaran Transfer</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-16 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xs">{isMounted ? bankName : "BCA"}</div>
                                <div>
                                    <p className="font-bold text-slate-900">{isMounted ? bankAccountNumber : "8830-123-456"}</p>
                                    <p className="text-xs text-slate-500 uppercase">
                                        A.N {isMounted ? bankAccountHolder : "SEWLOVELY HOMESET"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 italic">
                            *Mohon lampirkan bukti transfer kepada mitra/admin kami untuk verifikasi pembayaran.
                        </p>
                    </div>
                )}

                <div className="text-center pt-8 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-900 mb-1">Terima Kasih</p>
                    <p className="text-xs text-slate-500">
                        Telah mempercayakan kebutuhan tirai medis Anda kepada {isMounted ? appName : "Sewlovely Homeset"}.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function HospitalInvoicePage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat data invoice...</div>}>
            <InvoiceContent />
        </React.Suspense>
    );
}
