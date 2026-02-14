"use client";

import * as React from "react";
import { Calendar, Clock, MapPin, Phone, ClipboardList, CheckCircle, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCurrentPartner } from "@/lib/auth";
import { toast } from "sonner";
import SurveyCard from "./SurveyCard";

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
    // Filter tabs state
    const [activeTab, setActiveTab] = React.useState<string>("all");

    // Search state
    const [searchQuery, setSearchQuery] = React.useState("");
    const [appliedSearch, setAppliedSearch] = React.useState("");

    React.useEffect(() => {
        fetchSurveys();
    }, []);

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

    const handleSearch = () => {
        setAppliedSearch(searchQuery);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };



    const filteredSurveys = surveys.filter(survey => {
        // 1. Filter by Tab
        const authorizedStatus = activeTab === "all" ? true : survey.status === activeTab;

        // 2. Filter by Search (only if current appliedSearch is not empty)
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

    const tabs = [
        { id: "all", label: "Semua" },
        { id: "pending", label: "Penjadwalan" },
        { id: "confirmed", label: "Survey Visit" },
        { id: "completed", label: "Hasil Visit" },
        { id: "installation", label: "Pemasangan" },
        { id: "done", label: "Selesai" },
    ];

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Riwayat Survey</h1>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">Pantau status pengajuan survey Anda di sini</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Cari nama atau no hp..."
                        className="pl-11 bg-gray-50/50 border-gray-200 text-sm h-11 w-full focus:bg-white transition-colors rounded-xl"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value === "") {
                                setAppliedSearch("");
                            }
                        }}
                        onKeyDown={handleKeyPress}
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 rounded-xl font-medium shadow-sm shadow-emerald-200"
                >
                    Cari
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border",
                            activeTab === tab.id
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Survey List */}
            <div className="space-y-4">
                {filteredSurveys.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada jadwal survey</h3>
                        <p className="text-gray-500 text-sm">Silakan ajukan jadwal survey baru melalui menu di Dashboard</p>
                    </div>
                ) : (
                    filteredSurveys.map((survey) => (
                        <SurveyCard key={survey.id} survey={survey} />
                    ))
                )}
            </div>
        </div>
    );
}
