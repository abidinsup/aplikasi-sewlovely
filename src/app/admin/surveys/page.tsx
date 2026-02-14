"use client";

import * as React from "react";
import { Calendar, Clock, CheckCircle, XCircle, User, MapPin, Phone, Building2, Upload, Camera, Image as ImageIcon, X, Calculator, Banknote, FileText, BedDouble, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import SurveyCalculator from "./SurveyCalculator";
import TransactionHistoryModal from "./TransactionHistoryModal";
import { SurveyStatusStepper } from "@/components/admin/SurveyStatusStepper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { saveCommissionTransaction, getCommissionPercentage } from "@/lib/commission";
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
    kode_gorden_url?: string;
    motif_gorden_url?: string;
    partners?: {
        full_name: string;
        affiliate_code: string;
    };
    invoices?: {
        commission_paid: boolean;
    }[];
}

export default function SurveysPage() {
    const [surveys, setSurveys] = React.useState<SurveySchedule[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<"all" | "pending" | "confirmed" | "completed" | "installation" | "done">("all");
    const [uploadingId, setUploadingId] = React.useState<string | null>(null);
    const [isDisbursing, setIsDisbursing] = React.useState<string | null>(null);
    const [historyModalSurveyId, setHistoryModalSurveyId] = React.useState<string | null>(null);

    const [searchQuery, setSearchQuery] = React.useState("");

    // Helper functions moved to SurveyCard component or unused


    const fetchSurveys = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('survey_schedules')
                .select(`
                    *,
                    partners (
                        full_name,
                        affiliate_code
                    ),
                    invoices (
                        commission_paid
                    )
                `)
                .order('survey_date', { ascending: true })
                .order('survey_time', { ascending: true });

            if (filter !== "all") {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

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
    }, [filter]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('survey_schedules')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            const statusLabels: { [key: string]: string } = {
                confirmed: "Survey Visit",
                completed: "Selesai",
                cancelled: "Dibatalkan"
            };
            toast.success(`Status diubah menjadi ${statusLabels[newStatus] || newStatus}`);
            fetchSurveys();
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Gagal mengubah status');
        }
    };

    // Manual Commission Disbursement Logic
    const handleDisburseCommission = async (survey: SurveySchedule) => {
        if (!survey.partner_id) return;
        setIsDisbursing(survey.id);

        try {
            // 1. Find the invoice linked to this survey
            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('survey_id', survey.id)
                .single();

            if (invError || !invoice) {
                toast.error("Invoice tidak ditemukan untuk survey ini.");
                return;
            }

            if (invoice.commission_paid) {
                toast.info("Komisi untuk pesanan ini sudah dicairkan sebelumnya.");
                return;
            }

            if (invoice.payment_status !== 'paid') {
                toast.error("Invoice belum lunas. Komisi tidak dapat dicairkan.");
                return;
            }

            // 2. Calculate Commission
            const percentage = await getCommissionPercentage();

            // 3. Save Transaction
            const result = await saveCommissionTransaction(
                survey.partner_id,
                invoice.invoice_number,
                invoice.total_amount,
                percentage
            );

            if (!result.success) {
                throw new Error(result.error || "Gagal menyimpan transaksi komisi");
            }

            // 4. Mark Invoice as Commission Paid
            const { error: updateError } = await supabase
                .from('invoices')
                .update({ commission_paid: true })
                .eq('id', invoice.id);

            if (updateError) throw updateError;

            toast.success("Komisi berhasil dicairkan ke saldo mitra!");
            fetchSurveys();
        } catch (err: any) {
            console.error("Error disbursing commission:", err);
            toast.error("Gagal mencairkan komisi: " + err.message);
        } finally {
            setIsDisbursing(null);
        }
    };

    const handlePhotoUpload = async (surveyId: string, type: 'kode_gorden' | 'motif_gorden', file: File) => {
        if (!file) return;

        setUploadingId(surveyId);
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${surveyId}_${type}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('survey-photos')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('survey-photos')
                .getPublicUrl(fileName);

            // Update survey record with URL
            const updateField = type === 'kode_gorden' ? 'kode_gorden_url' : 'motif_gorden_url';
            const { error: updateError } = await supabase
                .from('survey_schedules')
                .update({ [updateField]: urlData.publicUrl, updated_at: new Date().toISOString() })
                .eq('id', surveyId);

            if (updateError) throw updateError;

            toast.success(`Foto ${type === 'kode_gorden' ? 'Kode Gorden' : 'Motif Gorden'} berhasil diupload!`);
            fetchSurveys();
        } catch (err) {
            console.error('Error uploading photo:', err);
            toast.error('Gagal mengupload foto. Pastikan storage bucket sudah dibuat.');
        } finally {
            setUploadingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { bg: string; text: string; label: string } } = {
            pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Penjadwalan" },
            confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Survey Visit" },
            completed: { bg: "bg-purple-100", text: "text-purple-700", label: "Hasil Visit" },
            installation: { bg: "bg-orange-100", text: "text-orange-700", label: "Pemasangan" },
            done: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Selesai" },
            cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Dibatalkan" },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold", config.bg, config.text)}>
                {config.label}
            </span>
        );
    };

    const getCalculatorLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            general: "Survey Umum",
            gorden: "Gorden Rumah",
            kantor: "Gorden Kantor",
            rs: "Gorden RS",
            sprei: "Sprei & Bedcover"
        };
        return labels[type] || type;
    };

    const filteredSurveys = surveys.filter(survey => {
        const searchLower = searchQuery.toLowerCase();
        return (
            survey.customer_name?.toLowerCase().includes(searchLower) ||
            survey.customer_phone?.toLowerCase().includes(searchLower) ||
            survey.customer_address?.toLowerCase().includes(searchLower) ||
            (survey.partners?.full_name?.toLowerCase().includes(searchLower) ?? false)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Jadwal Survey</h1>
                    <p className="text-slate-500 text-sm">Kelola jadwal survey dari pengajuan mitra</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Cari nama customer, telepon, atau mitra..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: "all", label: "Semua" },
                    { value: "pending", label: "Penjadwalan" },
                    { value: "confirmed", label: "Survey Visit" },
                    { value: "completed", label: "Hasil Visit" },
                    { value: "installation", label: "Pemasangan" },
                    { value: "done", label: "Selesai" },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value as typeof filter)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                            filter === tab.value
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-slate-600 rounded-full mx-auto"></div>
                    <p className="text-slate-500 mt-4">Memuat data...</p>
                </div>
            ) : filteredSurveys.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">
                        {searchQuery ? "Data tidak ditemukan" :
                            filter === "all" ? "Belum Ada Jadwal Survey" :
                                filter === "pending" ? "Belum Ada Penjadwalan" :
                                    filter === "confirmed" ? "Belum Ada Survey Visit" :
                                        filter === "completed" ? "Belum Ada Hasil Visit" :
                                            filter === "installation" ? "Belum Ada Pemasangan" :
                                                "Belum Ada yang Selesai"}
                    </h3>
                    <p className="text-slate-500 text-sm">
                        {searchQuery ? "Coba kata kunci pencarian lain" :
                            filter === "all" ? "Jadwal survey dari mitra akan muncul di sini" :
                                filter === "pending" ? "Belum ada pengajuan survey baru dari mitra" :
                                    filter === "confirmed" ? "Belum ada survey yang sedang diproses" :
                                        filter === "completed" ? "Belum ada hasil visit survey" :
                                            filter === "installation" ? "Belum ada pemasangan yang sedang berjalan" :
                                                "Belum ada survey yang selesai sampai pemasangan"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredSurveys.map((survey) => (
                        <SurveyCard
                            key={survey.id}
                            survey={survey}
                            onUpdateStatus={updateStatus}
                            onDisburseCommission={handleDisburseCommission}
                            onViewHistory={(id) => setHistoryModalSurveyId(id)}
                            isDisbursing={isDisbursing === survey.id}
                        />
                    ))}
                </div>
            )}

            <TransactionHistoryModal
                isOpen={!!historyModalSurveyId}
                onClose={() => setHistoryModalSurveyId(null)}
                surveyId={historyModalSurveyId}
            />
        </div>
    );
}
