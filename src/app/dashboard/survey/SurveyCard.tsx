
import * as React from "react";
import { Calendar, Clock, CheckCircle, XCircle, User, MapPin, Phone, Building2, Upload, Camera, FileText, BedDouble, AlertCircle, ChevronDown, ChevronUp, Calculator, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface SurveyCardProps {
    survey: SurveySchedule;
}

export default function SurveyCard({ survey }: SurveyCardProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const statusConfig: { [key: string]: { bg: string; text: string; label: string; progress: number } } = {
        pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Penjadwalan", progress: 10 },
        confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Survey Visit", progress: 30 },
        completed: { bg: "bg-purple-100", text: "text-purple-700", label: "Hasil Visit", progress: 50 },
        production: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Produksi", progress: 70 },
        installation: { bg: "bg-orange-100", text: "text-orange-700", label: "Pemasangan", progress: 85 },
        done: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Selesai", progress: 100 },
        cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Dibatalkan", progress: 0 },
    };

    const getStatusBadge = (status: string) => {
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

                {/* Right Side Badges & Progress */}
                <div className="flex items-center gap-4">
                    {/* Mini Progress Bar (Desktop) */}
                    {survey.status !== 'cancelled' && (
                        <div className="hidden lg:flex flex-col items-end gap-1 w-32">
                            <div className="flex justify-between w-full text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                <span>Progress</span>
                                <span>{statusConfig[survey.status]?.progress || 0}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                    style={{ width: `${statusConfig[survey.status]?.progress || 0}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-200 hidden sm:inline-block">
                        {getCalculatorLabel(survey.calculator_type)}
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                    {/* Stepper */}
                    {survey.status !== 'cancelled' && (
                        <div className="mb-8 px-2 overflow-x-auto">
                            <SurveyStatusStepper currentStatus={survey.status} />
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Left: Survey Details */}
                        <div className="space-y-4 flex-1">
                            {/* Mobile Date/Time */}
                            <div className="flex md:hidden items-center gap-2 text-slate-900 bg-slate-50 p-3 rounded-xl w-fit">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-bold">{formatDate(survey.survey_date)}</span>
                                <div className="h-4 w-[1px] bg-slate-300 mx-2" />
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="font-bold">{survey.survey_time} WIB</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <User className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <span className="font-medium">{survey.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="p-1.5 bg-slate-100 rounded-lg">
                                        <Phone className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <span className="font-medium">{survey.customer_phone}</span>
                                </div>
                                <div className="flex items-start gap-2 text-slate-600 md:col-span-2">
                                    <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <span className="font-medium leading-relaxed">{survey.customer_address}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
