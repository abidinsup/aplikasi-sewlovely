import * as React from "react";
import { Calendar, Clock, CheckCircle, XCircle, User, MapPin, Phone, Building2, Upload, Camera, FileText, BedDouble, AlertCircle, ChevronDown, ChevronUp, Calculator, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SurveyStatusStepper } from "@/components/admin/SurveyStatusStepper";
import SurveyCalculator from "./SurveyCalculator";
import TransactionHistoryModal from "./TransactionHistoryModal"; // Assuming this is needed or handled parent side? Actually SurveyCard shouldn't handle the modal state if possible, but let's see. 
// Ah, the original code had the modal in the parent page. Let's keep the modal trigger in the card but the modal itself in the parent page or handle it via callback.
// Better: Pass `onViewHistory` callback.

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

interface SurveyCardProps {
    survey: SurveySchedule;
    onUpdateStatus: (id: string, status: string) => void;
    onDisburseCommission: (survey: SurveySchedule) => void;
    onViewHistory: (id: string) => void;
    isDisbursing: boolean;
}

export default function SurveyCard({ survey, onUpdateStatus, onDisburseCommission, onViewHistory, isDisbursing }: SurveyCardProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

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
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap", config.bg, config.text)}>
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

    const hasSpreiInterest = (notes?: string) => {
        if (!notes) return false;
        const normalized = notes.toLowerCase();
        return normalized.includes('sprei') || normalized.includes('bedcover');
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Header / Summary View */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-4 flex-1">
                    {/* Chevron */}
                    <div className={cn("p-2 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
                        <ChevronDown className="h-5 w-5" />
                    </div>

                    {/* Basic Info */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 flex-1">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 line-clamp-1">{survey.customer_name}</span>
                            {getStatusBadge(survey.status)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500 hidden md:flex">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(survey.survey_date)}</span>
                            <span className="mx-1">•</span>
                            <Clock className="h-4 w-4" />
                            <span>{survey.survey_time}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Status / Indicator (Mobile only maybe? or keep it clean) */}
                <div className="flex items-center gap-2">
                    {/* Calculator Type Badge */}
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-200 hidden sm:inline-block">
                        {getCalculatorLabel(survey.calculator_type)}
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                    {/* Stepper only for active flows (not cancelled) */}
                    {survey.status !== 'cancelled' && (
                        <div className="mb-8 px-2 overflow-x-auto">
                            <SurveyStatusStepper currentStatus={survey.status} />
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Left: Survey Details */}
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-4">
                                {hasSpreiInterest(survey.notes) && (
                                    <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-purple-200 animate-pulse">
                                        <BedDouble className="h-3.5 w-3.5" />
                                        + Sprei/Bedcover
                                    </div>
                                )}
                            </div>

                            {/* Additional Notes Alert - Only show on Pending & Survey Visit based on previous requirement */}
                            {['pending', 'confirmed'].includes(survey.status) && survey.notes && (
                                <div className={cn(
                                    "p-3 rounded-xl text-sm border flex items-start gap-3",
                                    hasSpreiInterest(survey.notes)
                                        ? "bg-amber-50 border-amber-200"
                                        : "bg-slate-50 border-slate-200"
                                )}>
                                    {hasSpreiInterest(survey.notes) ? (
                                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                    )}

                                    <div>
                                        <span className={cn(
                                            "font-bold block mb-1 text-xs uppercase tracking-wider",
                                            hasSpreiInterest(survey.notes) ? "text-amber-800" : "text-slate-600"
                                        )}>
                                            Catatan Tambahan
                                        </span>
                                        <p className={cn(
                                            "whitespace-pre-wrap leading-relaxed",
                                            hasSpreiInterest(survey.notes) ? "text-amber-900 font-medium" : "text-slate-600"
                                        )}>
                                            {survey.notes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Date/Time (visible inside when expanded if hidden in header) */}
                            <div className="flex md:hidden items-center gap-2 text-slate-900 bg-slate-50 p-3 rounded-xl w-fit">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-bold">{formatDate(survey.survey_date)}</span>
                                <div className="h-4 w-[1px] bg-slate-300 mx-2" />
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="font-bold">{survey.survey_time} WIB</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <User className="h-3.5 w-3.5 text-slate-500" />
                                    </div>
                                    <span className="font-medium text-xs">{survey.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                                    </div>
                                    <span className="font-medium text-xs">{survey.customer_phone}</span>
                                </div>
                                <div className="flex items-start gap-2 text-slate-600 md:col-span-2">
                                    <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                    </div>
                                    <span className="font-medium text-[11px] leading-relaxed">{survey.customer_address}</span>
                                </div>
                            </div>

                            {survey.partners && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100 mt-2">
                                    <Building2 className="h-3 w-3" />
                                    <span>Mitra: <strong>{survey.partners.full_name}</strong> ({survey.partners.affiliate_code})</span>
                                </div>
                            )}

                            {/* Calculator for Completed Survey */}
                            {survey.status === "completed" && (
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Calculator className="h-5 w-5 text-emerald-600" />
                                        Hitung Estimasi & Buat Invoice
                                    </h4>
                                    <SurveyCalculator survey={survey} />
                                </div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-row lg:flex-col gap-3 min-w-[200px] mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            {survey.status === "pending" && (
                                <>
                                    <Button
                                        onClick={() => onUpdateStatus(survey.id, "confirmed")}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 shadow-lg shadow-blue-600/20 w-full"
                                    >
                                        <Camera className="h-4 w-4" />
                                        Proses Survey Visit
                                    </Button>
                                    <Button
                                        onClick={() => onUpdateStatus(survey.id, "cancelled")}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 gap-2 h-10 w-full"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Tolak
                                    </Button>
                                </>
                            )}
                            {survey.status === "confirmed" && (
                                <Button
                                    onClick={() => onUpdateStatus(survey.id, "completed")}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 shadow-lg shadow-purple-600/20 w-full"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Selesaikan Visit
                                </Button>
                            )}
                            {survey.status === "completed" && (
                                <Button
                                    onClick={() => onUpdateStatus(survey.id, "installation")}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-10 shadow-lg shadow-orange-600/20 w-full"
                                >
                                    <Upload className="h-4 w-4" />
                                    Mulai Pemasangan
                                </Button>
                            )}
                            {survey.status === "installation" && (
                                <Button
                                    onClick={() => onUpdateStatus(survey.id, "done")}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shadow-lg shadow-emerald-600/20 w-full"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Selesai Pemasangan
                                </Button>
                            )}

                            {/* Commission & History Buttons */}
                            {survey.status === "done" && survey.partners && !survey.invoices?.some(inv => inv.commission_paid) && (
                                <Button
                                    onClick={() => onDisburseCommission(survey)}
                                    disabled={isDisbursing}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 shadow-lg shadow-blue-600/20 w-full"
                                >
                                    <Banknote className="h-4 w-4" />
                                    {isDisbursing ? "Memproses..." : "Cairkan Komisi"}
                                </Button>
                            )}

                            {survey.status === "done" && survey.partners && survey.invoices?.some(inv => inv.commission_paid) && (
                                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 w-full">
                                    <CheckCircle className="h-4 w-4" />
                                    Komisi Cair
                                </div>
                            )}

                            {survey.status === "done" && (
                                <Button
                                    onClick={() => onViewHistory(survey.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-slate-600 border-slate-200 hover:bg-slate-50 gap-2 h-10 w-full"
                                >
                                    <FileText className="h-4 w-4" />
                                    History Transaksi
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
