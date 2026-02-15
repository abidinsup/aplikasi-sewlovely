"use client";

import * as React from "react";
import { Search, MapPin, Calendar, ClipboardList, Loader2, Eye, Map, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCurrentPartner } from "@/lib/auth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SurveyStatusStepper } from "@/components/admin/SurveyStatusStepper";

interface SurveySchedule {
    id: string;
    partner_id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    survey_date: string;
    survey_time: string;
    calculator_type: string;
    status: string;
    notes?: string;
    created_at: string;
}

export default function SurveyPage() {
    const [surveys, setSurveys] = React.useState<SurveySchedule[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<string>("all");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [appliedSearch, setAppliedSearch] = React.useState("");

    // Modal State
    const [selectedSurvey, setSelectedSurvey] = React.useState<SurveySchedule | null>(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    const fetchSurveys = async () => {
        try {
            const partner = getCurrentPartner();
            if (!partner?.id) return;

            const { data, error } = await supabase
                .from('survey_schedules')
                .select('*')
                .eq('partner_id', partner.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSurveys(data || []);
        } catch (err) {
            console.error('Error fetching surveys:', err);
            toast.error('Gagal memuat data survey');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSurveys();
    }, []);

    const handleSearch = () => {
        setAppliedSearch(searchQuery);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const config: { [key: string]: { bg: string; text: string; label: string } } = {
            pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Penjadwalan" },
            confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Survey Visit" },
            completed: { bg: "bg-purple-100", text: "text-purple-700", label: "Hasil Visit" },
            production: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Produksi" },
            installation: { bg: "bg-orange-100", text: "text-orange-700", label: "Pemasangan" },
            done: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Selesai" },
            cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Batal" },
        };

        const { bg, text, label } = config[status] || { bg: "bg-slate-100", text: "text-slate-500", label: status };
        return (
            <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold capitalize whitespace-nowrap", bg, text)}>
                {label}
            </span>
        );
    };

    const tabs = [
        { id: "all", label: "Semua" },
        { id: "pending", label: "Penjadwalan" },
        { id: "confirmed", label: "Survey Visit" },
        { id: "completed", label: "Hasil Visit" },
        { id: "installation", label: "Pemasangan" },
        { id: "done", label: "Selesai" },
    ];

    const filteredSurveys = surveys.filter(survey => {
        const authorizedStatus = activeTab === "all" ? true : survey.status === activeTab;
        let matchesSearch = true;
        if (appliedSearch) {
            const lowerSearch = appliedSearch.toLowerCase();
            matchesSearch =
                survey.customer_name.toLowerCase().includes(lowerSearch) ||
                survey.customer_phone.toLowerCase().includes(lowerSearch) ||
                survey.customer_address.toLowerCase().includes(lowerSearch);
        }
        return authorizedStatus && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Riwayat Survey</h1>
                <p className="text-slate-500 text-xs md:text-sm mt-1">Pantau status pengajuan survey Anda di sini</p>
            </div>

            {/* Main Unified Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search Header inside Card */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-900 hidden md:block">List Pengajuan Survey</h3>

                    <div className="flex items-center gap-2 max-w-sm w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari nama atau no hp..."
                                className="!pl-10 bg-slate-50 border-slate-200 text-sm h-10 w-full focus:bg-white transition-colors rounded-xl"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value === "") setAppliedSearch("");
                                }}
                                onKeyDown={handleKeyPress}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="bg-emerald-600 text-white font-bold h-10 px-6 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]"
                        >
                            Cari
                        </Button>
                    </div>
                </div>

                {/* Tabs Slider inside Card */}
                <div className="bg-slate-50/50 border-b border-slate-100 px-4 pt-4">
                    <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border",
                                    activeTab === tab.id
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                                        : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Alamat / Lokasi</th>
                                <th className="p-4">Tanggal Survey</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredSurveys.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                                        Tidak ada data survey ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filteredSurveys.map((survey) => (
                                    <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div
                                                className="flex flex-col cursor-pointer group/name"
                                                onClick={() => {
                                                    setSelectedSurvey(survey);
                                                    setIsDetailOpen(true);
                                                }}
                                            >
                                                <span className="font-bold text-slate-900 group-hover/name:text-emerald-600 transition-colors line-clamp-1 underline-offset-4 hover:underline">
                                                    {survey.customer_name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">{survey.customer_phone}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            <div className="flex items-center gap-1.5 max-w-[200px]">
                                                <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                                                <span className="text-xs line-clamp-1">{survey.customer_address}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-medium text-xs whitespace-nowrap">
                                                    {formatDate(survey.survey_date)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(survey.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL DIALOG */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    Detail Pengajuan Survey
                                    <div className="ml-2">
                                        {selectedSurvey && getStatusBadge(selectedSurvey.status)}
                                    </div>
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    ID: {selectedSurvey?.id.substring(0, 8)}...
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedSurvey && (
                        <div className="space-y-6 py-4">
                            {/* Stepper */}
                            {selectedSurvey.status !== 'cancelled' && (
                                <div className="px-2 overflow-x-auto pb-2">
                                    <SurveyStatusStepper currentStatus={selectedSurvey.status} />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Informasi Customer</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl border border-slate-200">
                                                <ClipboardList className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Nama</p>
                                                <p className="text-sm font-bold text-slate-900">{selectedSurvey.customer_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl border border-slate-200">
                                                <Phone className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">No. WhatsApp</p>
                                                <p className="text-sm font-bold text-slate-900">{selectedSurvey.customer_phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl border border-slate-200">
                                                <MapPin className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Alamat</p>
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedSurvey.customer_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Survey Details */}
                                <div className="space-y-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                    <h4 className="font-bold text-xs text-emerald-600 uppercase tracking-widest">Detail Jadwal</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl border border-emerald-100">
                                                <Calendar className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-emerald-500 font-bold uppercase">Tanggal Survey</p>
                                                <p className="text-sm font-bold text-slate-900">{formatDate(selectedSurvey.survey_date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-xl border border-emerald-100">
                                                <Map className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-emerald-500 font-bold uppercase">Tipe Survey</p>
                                                <p className="text-sm font-bold text-slate-900 capitalize">{selectedSurvey.calculator_type}</p>
                                            </div>
                                        </div>
                                        {selectedSurvey.notes && (
                                            <div className="pt-2">
                                                <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Catatan Tambahan</p>
                                                <p className="text-sm text-slate-600 italic bg-white p-2 rounded-lg border border-emerald-50">
                                                    "{selectedSurvey.notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl px-8" onClick={() => setIsDetailOpen(false)}>
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
