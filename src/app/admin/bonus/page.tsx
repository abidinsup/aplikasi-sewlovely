"use client";

import * as React from "react";
import { Gift, Search, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addManualBonus } from "@/lib/commission";
import { cn } from "@/lib/utils";

interface Partner {
    id: string;
    full_name: string;
    email: string;
    affiliate_code: string;
}

export default function AdminBonusPage() {
    const [partners, setPartners] = React.useState<Partner[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [inputValue, setInputValue] = React.useState("");
    const [selectedPartner, setSelectedPartner] = React.useState<Partner | null>(null);
    const [bonusAmount, setBonusAmount] = React.useState("");
    const [bonusDescription, setBonusDescription] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    // Fetch partners
    React.useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const { data, error } = await supabase
                .from('partners')
                .select('id, full_name, email, affiliate_code')
                .order('full_name');

            if (data) {
                setPartners(data);
            }
        } catch (err) {
            console.error('Error fetching partners:', err);
        }
    };

    const handleSearch = () => {
        setSearchQuery(inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const filteredPartners = partners.filter(p =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.affiliate_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (value: string) => {
        const number = value.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrency(e.target.value);
        setBonusAmount(formatted);
    };

    const handleSendBonus = async () => {
        if (!selectedPartner || !bonusAmount) {
            toast.error("Pilih mitra dan masukkan jumlah bonus");
            return;
        }

        const amount = parseInt(bonusAmount.replace(/\./g, ''));
        if (amount < 1000) {
            toast.error("Minimum bonus Rp 1.000");
            return;
        }

        setIsLoading(true);

        try {
            const result = await addManualBonus(
                selectedPartner.id,
                amount,
                bonusDescription || `Bonus dari Admin`
            );

            if (!result.success) throw new Error(result.error);

            toast.success("Bonus berhasil dikirim!", {
                description: `Rp ${amount.toLocaleString('id-ID')} ke ${selectedPartner.full_name}`
            });

            // Reset form
            setSelectedPartner(null);
            setBonusAmount("");
            setBonusDescription("");
        } catch (err: any) {
            toast.error("Gagal mengirim bonus", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Bonus Manual</h1>
                <p className="text-slate-500">Kirim bonus atau komisi tambahan ke mitra</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pilih Mitra */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Pilih Mitra</h3>
                            <p className="text-sm text-slate-500">Cari dan pilih mitra penerima bonus</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari nama, email, atau kode afiliasi..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="bg-[#63e5ff] text-slate-900 font-bold hover:bg-cyan-400 shadow-sm shadow-cyan-400/20"
                        >
                            Cari
                        </Button>
                    </div>

                    {/* Partner List */}
                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {filteredPartners.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Tidak ada mitra ditemukan</p>
                        ) : (
                            filteredPartners.map((partner) => (
                                <button
                                    key={partner.id}
                                    onClick={() => setSelectedPartner(partner)}
                                    className={cn(
                                        "w-full p-4 rounded-xl border text-left transition-all",
                                        selectedPartner?.id === partner.id
                                            ? "bg-emerald-50 border-emerald-300"
                                            : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                                    )}
                                >
                                    <p className="font-bold text-slate-900">{partner.full_name}</p>
                                    <p className="text-sm text-slate-500">{partner.email}</p>
                                    <p className="text-xs text-emerald-600 font-mono mt-1">{partner.affiliate_code}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Form Bonus */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Gift className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Detail Bonus</h3>
                            <p className="text-sm text-slate-500">Masukkan jumlah dan keterangan</p>
                        </div>
                    </div>

                    {/* Selected Partner */}
                    {selectedPartner ? (
                        <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100">
                            <p className="text-sm text-emerald-600 mb-1">Mitra Terpilih:</p>
                            <p className="font-bold text-emerald-800">{selectedPartner.full_name}</p>
                            <p className="text-sm text-emerald-600">{selectedPartner.affiliate_code}</p>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-center">
                            <p className="text-slate-400">Belum ada mitra dipilih</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Jumlah Bonus</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                <Input
                                    value={bonusAmount}
                                    onChange={handleAmountChange}
                                    placeholder="0"
                                    className="pl-12 h-14 text-xl font-bold"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Keterangan (Opsional)</label>
                            <Input
                                value={bonusDescription}
                                onChange={(e) => setBonusDescription(e.target.value)}
                                placeholder="Contoh: Bonus pencapaian target"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            onClick={handleSendBonus}
                            disabled={isLoading || !selectedPartner || !bonusAmount}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold gap-2 mt-4"
                        >
                            <Send className="h-5 w-5" />
                            {isLoading ? "Mengirim..." : "Kirim Bonus"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
