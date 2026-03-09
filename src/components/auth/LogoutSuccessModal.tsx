"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, CheckCircle2 } from "lucide-react";

interface LogoutSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
    role?: "Owner" | "Admin" | "Mitra";
}

const LogoutSuccessModal: React.FC<LogoutSuccessModalProps> = ({
    isOpen,
    onClose,
    userName = "User",
    role = "Mitra",
}) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setProgress(0);
            const timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 20);

            const closeTimer = setTimeout(() => {
                onClose();
            }, 2000);

            return () => {
                clearInterval(timer);
                clearTimeout(closeTimer);
            };
        }
    }, [isOpen, onClose]);

    const getRoleLabel = () => {
        switch (role) {
            case "Owner":
                return "OWNER / SUPER ADMIN";
            case "Admin":
                return "ADMINISTRATOR SYSTEM";
            default:
                return "MITRA AFFILIATE RESMI";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with Soft Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-400/20 backdrop-blur-sm"
                    />

                    {/* Modal Content - Match Logout Design */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[3rem] bg-white p-10 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100"
                    >
                        <div className="relative z-10 flex flex-col items-center">

                            {/* Icon Container with Shadow and LogOut Icon */}
                            <div className="relative mb-8">
                                <motion.div
                                    initial={{ rotate: 10, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                    className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_8px_16px_-4px_rgba(239,68,68,0.1)] border border-red-50"
                                >
                                    <LogOut className="w-10 h-10 text-red-500" />
                                </motion.div>

                                {/* Overlaid Check Icon */}
                                <motion.div
                                    initial={{ scale: 0, x: -10, y: 10 }}
                                    animate={{ scale: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="absolute -right-3 -bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#10b981] text-white shadow-lg border-4 border-white"
                                >
                                    <CheckCircle2 className="w-6 h-6 fill-white text-[#10b981]" />
                                </motion.div>
                            </div>

                            {/* Text Elements */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-1 mb-8"
                            >
                                <h2 className="text-[32px] font-black text-[#1e293b] leading-tight mb-2">
                                    Berhasil Keluar!
                                </h2>
                                <p className="text-[#64748b] text-xl font-medium">
                                    Sampai jumpa lagi,
                                </p>
                            </motion.div>

                            {/* User Name Badge (Optional for Logout) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full py-4 px-6 rounded-[2rem] bg-[#fef2f2] mb-6"
                            >
                                <span className="text-red-500 text-2xl font-black uppercase tracking-wide">
                                    {userName}
                                </span>
                            </motion.div>

                            <p className="text-[#94a3b8] text-[11px] font-bold tracking-[0.25em] mb-10 uppercase">
                                {getRoleLabel()}
                            </p>

                            {/* Gradient Progress Bar */}
                            <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-3">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-red-400 to-orange-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>

                            <p className="text-[#94a3b8] text-xs font-medium italic">
                                Kembali ke halaman login...
                            </p>
                        </div>

                        {/* Subtle background glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-100/30 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-100/30 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LogoutSuccessModal;
