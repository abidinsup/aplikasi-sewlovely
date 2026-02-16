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

    const fetchSurveys = async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const partner = getCurrentPartner();
            if (!partner?.id) {
                if (isInitial) setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('survey_schedules')
                .select('*')
                .eq('partner_id', partner.id)
                .order('created_at', { ascending: false })
                .limit(50); // Performance: Limit to last 50 surveys

            if (error) throw error;
            setSurveys(data || []);
        } catch (err) {
            console.error('Error fetching surveys:', err);
            toast.error('Gagal memuat data survey');
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce realtime updates to avoid "Fetch Storms"
    const debouncedFetch = React.useRef<NodeJS.Timeout>();
    const handleRealtimeChange = () => {
        if (debouncedFetch.current) clearTimeout(debouncedFetch.current);
        debouncedFetch.current = setTimeout(() => {
            fetchSurveys();
        }, 1000); // Wait 1s after last change
    }

    React.useEffect(() => {
        const partner = getCurrentPartner();

        // Initial fetch
        fetchSurveys(true);

        if (!partner?.id) return;

        // Subscribe to realtime changes for this partner
        const channel = supabase
            .channel(`partner-surveys-${partner.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'survey_schedules',
                    filter: `partner_id=eq.${partner.id}`
                },
                () => handleRealtimeChange()
            )
            .subscribe();

        return () => {
            if (debouncedFetch.current) clearTimeout(debouncedFetch.current);
            supabase.removeChannel(channel);
        };
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
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <h3 className="font-bold text-slate-900 hidden md:block">List Pengajuan Survey</h3>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari nama atau no hp..."
                                className="!pl-10 bg-slate-50 border-slate-200 text-sm h-11 md:h-10 w-full focus:bg-white transition-colors rounded-xl font-medium"
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
                            className="w-full sm:w-auto bg-emerald-600 text-white font-bold h-11 md:h-10 px-8 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all active:scale-[0.98]"
                        >
                            Cari
                        </Button>
                    </div>
                </div>

                {/* Tabs Slider inside Card */}
                <div className="bg-slate-50/50 border-b border-slate-100 px-4 pt-4">
                    <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide no-scrollbar relative z-10">
                        {tabs.map((tab) => (
                            <button
                                id={`tab-${tab.id}`}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border",
                                    activeTab === tab.id
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105"
                                        : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden p-4 space-y-4 bg-slate-50/30">
                    {filteredSurveys.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">
                            Tidak ada data survey ditemukan
                        </div>
                    ) : (
                        filteredSurveys.map((survey) => (
                            <div
                                key={survey.id}
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                                onClick={() => {
                                    setSelectedSurvey(survey);
                                    setIsDetailOpen(true);
                                }}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-extrabold text-slate-900 text-base leading-tight truncate">{survey.customer_name}</p>
                                        <p className="text-[11px] text-emerald-600 font-bold mt-0.5 tracking-wide">{survey.customer_phone}</p>
                                    </div>
                                    <div className="shrink-0 scale-90 origin-top-right">
                                        {getStatusBadge(survey.status)}
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="bg-slate-100 p-1 rounded-md">
                                            <MapPin className="h-3 w-3 text-slate-400" />
                                        </div>
                                        <span className="text-xs text-slate-600 line-clamp-1">{survey.customer_address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="bg-emerald-50 p-1 rounded-md">
                                            <Calendar className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{formatDate(survey.survey_date)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar pb-2 px-1">
                    <div className="min-w-full inline-block align-middle">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-sm uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-4 whitespace-nowrap min-w-[140px]">Customer</th>
                                    <th className="p-4 whitespace-nowrap min-w-[200px]">Alamat / Lokasi</th>
                                    <th className="p-4 whitespace-nowrap min-w-[120px]">Tanggal Survey</th>
                                    <th className="p-4 text-center whitespace-nowrap min-w-[100px]">Status</th>
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
                                                    className="flex flex-col cursor-pointer group/name min-w-[140px]"
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
                                                <div className="flex items-start gap-1.5 min-w-[200px]">
                                                    <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400 mt-0.5" />
                                                    <span className="text-xs line-clamp-2 leading-relaxed">{survey.customer_address}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 whitespace-nowrap min-w-[120px]">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="font-medium text-xs">
                                                        {formatDate(survey.survey_date)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="min-w-[100px] flex justify-center">
                                                    {getStatusBadge(survey.status)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* DETAIL DIALOG */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl w-[95vw] md:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-50 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    Detail Pengajuan Survey
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-xs font-medium text-slate-400">
                                    ID: {selectedSurvey?.id.substring(0, 8)}...
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedSurvey && getStatusBadge(selectedSurvey.status)}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {selectedSurvey && (
                            <>
                                {/* Stepper Section */}
                                {selectedSurvey.status !== 'cancelled' && (
                                    <div className="bg-white rounded-2xl pt-2 pb-10">
                                        <SurveyStatusStepper currentStatus={selectedSurvey.status} />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Customer Info */}
                                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] pl-1">Informasi Customer</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    <ClipboardList className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Nama</p>
                                                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSurvey.customer_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    <Phone className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">No. WhatsApp</p>
                                                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSurvey.customer_phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Alamat</p>
                                                    <p className="text-sm font-semibold text-slate-600 leading-relaxed mt-0.5">{selectedSurvey.customer_address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Survey Details */}
                                    <div className="space-y-4 bg-emerald-50/30 p-5 rounded-3xl border border-emerald-100/50">
                                        <h4 className="font-bold text-[10px] text-emerald-600 uppercase tracking-[0.2em] pl-1">Detail Jadwal</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-emerald-100">
                                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Tanggal Survey</p>
                                                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatDate(selectedSurvey.survey_date)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-emerald-100">
                                                    <Map className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Tipe Survey</p>
                                                    <p className="text-sm font-extrabold text-slate-900 mt-0.5 capitalize">{selectedSurvey.calculator_type}</p>
                                                </div>
                                            </div>
                                            {selectedSurvey.notes && ['pending', 'confirmed'].includes(selectedSurvey.status) && (
                                                <div className="pt-2">
                                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mb-1.5 pl-1">Catatan Tambahan</p>
                                                    <div className="bg-white/80 p-3 rounded-2xl border border-emerald-100 text-sm text-slate-600 italic">
                                                        &quot;{selectedSurvey.notes}&quot;
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-50 bg-slate-50/50 shrink-0 flex justify-end">
                        <Button
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-12 h-12 shadow-lg shadow-emerald-200"
                            onClick={() => setIsDetailOpen(false)}
                        >
                            Tutup Halaman
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
