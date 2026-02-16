import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, MapPin, Wrench, CheckCheck } from 'lucide-react';

interface SurveyStatusStepperProps {
    currentStatus: string;
    className?: string;
}

const steps = [
    { id: 'pending', label: 'Penjadwalan', icon: Clock },
    { id: 'confirmed', label: 'Survey Visit', icon: MapPin },
    { id: 'completed', label: 'Hasil Visit', icon: CheckCircle2 },
    { id: 'production', label: 'Produksi', icon: Wrench },
    { id: 'installation', label: 'Pemasangan', icon: CheckCircle2 },
    { id: 'done', label: 'Selesai', icon: CheckCheck },
];

export function SurveyStatusStepper({ currentStatus, className }: SurveyStatusStepperProps) {
    // Find index of current status
    const currentIndex = steps.findIndex(step => step.id === currentStatus);

    // If status is 'cancelled', show a special state or just return null/simple badge handled by parent
    if (currentStatus === 'cancelled') return null;

    return (
        <div className={cn("w-full py-2", className)}>
            <div className="relative flex items-center justify-between w-full min-w-[650px] md:min-w-0 px-10 md:px-0">
                {/* Connecting Line Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full" />

                {/* Connecting Line Progress */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 -z-10 rounded-full transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    style={{ width: `${Math.min(100, (Math.max(0, currentIndex) / (steps.length - 1)) * 100)}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center group cursor-default">
                            {/* Icon Circle */}
                            <div
                                className={cn(
                                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white z-10",
                                    isCompleted
                                        ? "border-emerald-500 bg-white text-emerald-600 shadow-md"
                                        : "border-slate-200 text-slate-300",
                                    isCurrent && "ring-4 ring-emerald-100 scale-110 border-emerald-600 text-emerald-700 font-bold shadow-lg"
                                )}
                            >
                                <Icon className={cn("w-3.5 h-3.5 md:w-5 md:h-5", isCurrent && "animate-pulse")} />
                            </div>

                            {/* Label */}
                            <div className="absolute -bottom-10 md:-bottom-12 w-16 md:w-24 text-center flex flex-col items-center px-0.5">
                                <span
                                    className={cn(
                                        "text-[7px] md:text-[10px] font-bold uppercase tracking-tighter md:tracking-wider transition-colors duration-300 leading-[1.1] block break-words",
                                        isCompleted ? "text-emerald-700" : "text-slate-400",
                                        isCurrent && "text-emerald-900 scale-105"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Spacer to prevent overlap with content below */}
            <div className="h-12 md:h-10" />
        </div>
    );
}
