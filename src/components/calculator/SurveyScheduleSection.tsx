"use client";

import * as React from "react";
import { Calendar, Clock, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface SurveyScheduleSectionProps {
    calculatorType: "gorden" | "kantor" | "rs";
    onScheduleChange: (date: string | null, time: string | null) => void;
    className?: string;
}

const TIME_SLOTS = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

export function SurveyScheduleSection({ calculatorType, onScheduleChange, className }: SurveyScheduleSectionProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
    const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = React.useState<{ date: string; time: string }[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    // Generate next 7 days
    const getAvailableDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                value: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
            });
        }
        return dates;
    };

    const availableDates = getAvailableDates();

    // Fetch booked slots
    React.useEffect(() => {
        const fetchBookedSlots = async () => {
            try {
                const { data, error } = await supabase
                    .from('survey_schedules')
                    .select('survey_date, survey_time')
                    .gte('survey_date', new Date().toISOString().split('T')[0])
                    .in('status', ['pending', 'confirmed']);

                if (!error && data) {
                    setBookedSlots(data.map(d => ({
                        date: d.survey_date,
                        time: d.survey_time
                    })));
                }
            } catch (err) {
                console.error('Error fetching booked slots:', err);
            }
        };

        if (isOpen) {
            fetchBookedSlots();
        }
    }, [isOpen]);

    const isSlotBooked = (date: string, time: string) => {
        return bookedSlots.some(slot => slot.date === date && slot.time === time);
    };

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onScheduleChange(selectedDate, selectedTime);
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setSelectedDate(null);
        setSelectedTime(null);
        onScheduleChange(null, null);
    };

    const formatSelectedDate = () => {
        if (!selectedDate) return null;
        const date = new Date(selectedDate);
        return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <section className={cn("bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4", className)}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Calendar className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-lg">Jadwalkan Survey</h2>
            </div>

            {/* Show selected schedule or button */}
            {selectedDate && selectedTime ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-bold text-emerald-800">{formatSelectedDate()}</p>
                                <p className="text-emerald-600 text-sm">Pukul {selectedTime} WIB</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClear}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <Button
                        onClick={() => setIsOpen(true)}
                        variant="outline"
                        className="w-full h-10 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    >
                        Ubah Jadwal
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                    <Calendar className="h-5 w-5" />
                    Jadwalkan Survey
                </Button>
            )}

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between rounded-t-3xl">
                            <h3 className="font-bold text-lg text-slate-900">Pilih Jadwal Survey</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Date Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Pilih Tanggal
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableDates.map((date) => (
                                        <button
                                            key={date.value}
                                            onClick={() => setSelectedDate(date.value)}
                                            className={cn(
                                                "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                                selectedDate === date.value
                                                    ? "bg-blue-50 border-blue-500 text-blue-700"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                                            )}
                                        >
                                            {date.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Selection */}
                            {selectedDate && (
                                <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Pilih Waktu
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {TIME_SLOTS.map((time) => {
                                            const booked = isSlotBooked(selectedDate, time);
                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => !booked && setSelectedTime(time)}
                                                    disabled={booked}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                                        booked
                                                            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through"
                                                            : selectedTime === time
                                                                ? "bg-blue-50 border-blue-500 text-blue-700"
                                                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50"
                                                    )}
                                                >
                                                    {time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {bookedSlots.some(s => s.date === selectedDate) && (
                                        <p className="text-xs text-slate-400 italic">
                                            * Waktu yang dicoret sudah dibooking
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 rounded-b-3xl">
                            <Button
                                onClick={handleConfirm}
                                disabled={!selectedDate || !selectedTime}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Konfirmasi Jadwal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
