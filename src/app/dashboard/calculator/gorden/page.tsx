"use client";

import * as React from "react";
import { ArrowLeft, Building2, Calendar, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCurrentPartner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SurveyRequestPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    // State
    const [customerInfo, setCustomerInfo] = React.useState({ name: "", phone: "", address: "" });
    const [surveyDate, setSurveyDate] = React.useState<string>("");
    const [surveyTime, setSurveyTime] = React.useState<string>("");
    const [bookedTimes, setBookedTimes] = React.useState<string[]>([]);;

    // All available time slots
    const allTimeSlots = [
        { value: "09:00", label: "09:00 - 10:00" },
        { value: "10:00", label: "10:00 - 11:00" },
        { value: "11:00", label: "11:00 - 12:00" },
        { value: "13:00", label: "13:00 - 14:00" },
        { value: "14:00", label: "14:00 - 15:00" },
        { value: "15:00", label: "15:00 - 16:00" },
        { value: "16:00", label: "16:00 - 17:00" },
    ];

    // Get minimum date (today if before 17:00, tomorrow if after)
    const getMinDate = () => {
        const now = new Date();
        const currentHour = now.getHours();

        // If past 17:00, minimum date is tomorrow
        if (currentHour >= 17) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }

        return now.toISOString().split('T')[0];
    };

    // Get available time slots based on selected date (excluding booked)
    const getAvailableTimeSlots = () => {
        const today = new Date().toISOString().split('T')[0];
        let slots = allTimeSlots;

        // Filter out past times if today
        if (surveyDate === today) {
            const currentHour = new Date().getHours();
            slots = slots.filter(slot => {
                const slotHour = parseInt(slot.value.split(':')[0]);
                return slotHour > currentHour;
            });
        }

        // Filter out booked times
        return slots.filter(slot => !bookedTimes.includes(slot.value));
    };

    // Fetch booked slots when date changes
    React.useEffect(() => {
        if (!surveyDate) {
            setBookedTimes([]);
            return;
        }
        const fetchBooked = async () => {
            const { data } = await supabase
                .from('survey_schedules')
                .select('survey_time')
                .eq('survey_date', surveyDate)
                .in('status', ['pending', 'confirmed']);
            setBookedTimes(data?.map(d => d.survey_time) || []);
        };
        fetchBooked();
    }, [surveyDate]);
    React.useEffect(() => {
        const availableSlots = getAvailableTimeSlots();
        if (surveyTime && !availableSlots.find(s => s.value === surveyTime)) {
            setSurveyTime("");
        }
    }, [surveyDate]);

    const handleSubmitSurvey = async () => {
        // Validation
        if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
            toast.warning("Mohon lengkapi data customer");
            return;
        }

        if (!surveyDate || !surveyTime) {
            toast.warning("Mohon pilih tanggal dan waktu survey");
            return;
        }

        // Validate selected time is still available
        const availableSlots = getAvailableTimeSlots();
        if (!availableSlots.find(s => s.value === surveyTime)) {
            toast.error("Waktu yang dipilih sudah tidak tersedia. Silakan pilih waktu lain.");
            setSurveyTime("");
            return;
        }

        setIsSubmitting(true);

        try {
            const partner = getCurrentPartner();

            const { error } = await supabase
                .from('survey_schedules')
                .insert({
                    partner_id: partner?.id || null,
                    customer_name: customerInfo.name,
                    customer_phone: customerInfo.phone,
                    customer_address: customerInfo.address,
                    survey_date: surveyDate,
                    survey_time: surveyTime,
                    calculator_type: 'gorden',
                    status: 'pending'
                });

            if (error) {
                console.error('Error saving survey:', error);
                toast.error("Gagal mengajukan survey. Silakan coba lagi.");
            } else {
                setIsSuccess(true);
                toast.success("Jadwal survey berhasil diajukan!");

                // Reset form after 2 seconds and redirect
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            }
        } catch (err) {
            console.error('Error saving survey:', err);
            toast.error("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Survey Berhasil Diajukan!</h2>
                    <p className="text-slate-500 mb-6">
                        Tim kami akan menghubungi customer Anda untuk konfirmasi jadwal survey.
                    </p>
                    <p className="text-sm text-slate-400">Mengalihkan ke dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full h-10 w-10 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Ajukan Survey Gorden Rumah</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-32">
                <div className="space-y-6">
                    {/* Data Pemesan */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Data Customer</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Nama Lengkap</label>
                                <Input
                                    placeholder="Nama Customer"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">No. WhatsApp</label>
                                <Input
                                    placeholder="085159588681"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Alamat Pemasangan</label>
                                <Input
                                    placeholder="Jl. Contoh No. 123, Jakarta Selatan"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl placeholder:text-slate-300"
                                    value={customerInfo.address}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Jadwal Survey */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Calendar className="h-5 w-5" /></div>
                            <h2 className="font-bold text-slate-900 text-lg">Jadwal Survey</h2>
                        </div>
                        <p className="text-sm text-slate-500">
                            Pilih tanggal dan waktu yang diinginkan customer untuk dikunjungi tim survey kami.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Tanggal Survey</label>
                                <Input
                                    type="date"
                                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl cursor-pointer"
                                    value={surveyDate}
                                    onChange={(e) => setSurveyDate(e.target.value)}
                                    // Open date picker on click anywhere in the input
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                    min={getMinDate()}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Waktu Survey</label>
                                {getAvailableTimeSlots().length === 0 && surveyDate === new Date().toISOString().split('T')[0] ? (
                                    <div className="h-12 bg-amber-50 border border-amber-200 rounded-xl px-4 flex items-center text-amber-700 text-sm">
                                        Tidak ada slot tersedia hari ini. Pilih tanggal lain.
                                    </div>
                                ) : (
                                    <select
                                        className="h-12 w-full bg-slate-50 border border-slate-200 focus:ring-emerald-500 rounded-xl px-4 text-slate-700"
                                        value={surveyTime}
                                        onChange={(e) => setSurveyTime(e.target.value)}
                                    >
                                        <option value="">Pilih waktu</option>
                                        {getAvailableTimeSlots().map(slot => (
                                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Info Box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <p className="text-sm text-emerald-700">
                            <strong>Catatan:</strong> Setelah Anda mengajukan survey, tim kami akan menghubungi customer untuk mengkonfirmasi jadwal.
                            Proses perhitungan harga dan invoice akan dilakukan setelah survey selesai.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmitSurvey}
                        disabled={isSubmitting}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/50 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>Mengajukan...</>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Ajukan Survey
                            </>
                        )}
                    </Button>
                </div>
            </main>
        </div>
    );
}
