"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LogOut, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InactivityWarningModalProps {
    isOpen: boolean;
    onClose: (stayActive: boolean) => void;
    secondsRemaining: number;
}

const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
    isOpen,
    onClose,
    secondsRemaining,
}) => {
    const progress = (secondsRemaining / 60) * 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with heavy blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-1 shadow-2xl backdrop-blur-2xl"
                    >
                        {/* Glass decoration */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" />

                        <div className="relative z-10 bg-black/20 rounded-[2.3rem] p-8">
                            <div className="flex flex-col items-center text-center">
                                {/* Visual Timer */}
                                <div className="relative mb-8 h-32 w-32 flex items-center justify-center">
                                    <svg className="h-full w-full rotate-[-90deg]">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="8"
                                            fill="transparent"
                                        />
                                        <motion.circle
                                            cx="64"
                                            cy="64"
                                            r="58"
                                            stroke="url(#gradient-warning)"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray="364.4"
                                            initial={{ strokeDashoffset: 0 }}
                                            animate={{ strokeDashoffset: 364.4 - (364.4 * secondsRemaining) / 60 }}
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-4xl font-bold text-white tabular-nums">
                                            {secondsRemaining}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Detik</span>
                                    </div>
                                </div>

                                <div className="mb-2 flex items-center gap-2 text-emerald-400">
                                    <Clock className="w-5 h-5 animate-pulse" />
                                    <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400/80">Sesi Hampir Berakhir</span>
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-3">
                                    Masih di Sana?
                                </h2>

                                <p className="text-white/70 text-base mb-8 px-4 leading-relaxed">
                                    Anda telah tidak aktif selama 14 menit. Demi keamanan, sesi Anda akan segera berakhir secara otomatis.
                                </p>

                                {/* Progressive Bar */}
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-8">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                                        initial={{ width: "100%" }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "linear" }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <Button
                                        onClick={() => onClose(true)}
                                        className="h-14 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-bold group shadow-lg shadow-white/10"
                                    >
                                        Tetap Aktif
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                    <Button
                                        onClick={() => onClose(false)}
                                        variant="ghost"
                                        className="h-14 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all font-bold"
                                    >
                                        Keluar Saja
                                        <LogOut className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InactivityWarningModal;
