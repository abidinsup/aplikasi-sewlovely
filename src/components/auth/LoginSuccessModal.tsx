"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, CheckCircle2, ShieldCheck, UserCircle2, UserCheck } from "lucide-react";

interface LoginSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    role: "Owner" | "Admin" | "Mitra";
}

const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
    isOpen,
    onClose,
    userName,
    role,
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
                    return prev + 1;
                });
            }, 20);

            const closeTimer = setTimeout(() => {
                onClose();
            }, 2500);

            return () => {
                clearInterval(timer);
                clearTimeout(closeTimer);
            };
        }
    }, [isOpen, onClose]);

    const getRoleIcon = () => {
        switch (role) {
            case "Owner":
                return <Crown className="w-10 h-10 text-purple-500" />;
            case "Admin":
                return <ShieldCheck className="w-10 h-10 text-purple-500" />;
            default:
                return <UserCircle2 className="w-10 h-10 text-purple-500" />;
        }
    };

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

                    {/* Modal Content - Styled like the screenshot */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[3rem] bg-white p-10 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100"
                    >
                        <div className="relative z-10 flex flex-col items-center">

                            {/* Icon Container with Shadow and Crown */}
                            <div className="relative mb-8">
                                <motion.div
                                    initial={{ rotate: -10, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                    className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_8px_16px_-4px_rgba(168,85,247,0.1)] border border-purple-50"
                                >
                                    {getRoleIcon()}
                                </motion.div>

                                {/* Overlaid Check Icon */}
                                <motion.div
                                    initial={{ scale: 0, x: 10, y: 10 }}
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
                                    Berhasil Masuk!
                                </h2>
                                <p className="text-[#64748b] text-xl font-medium">
                                    Selamat datang kembali,
                                </p>
                            </motion.div>

                            {/* User Name Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full py-4 px-6 rounded-[2rem] bg-[#f5f3ff] mb-6"
                            >
                                <span className="text-[#7c3aed] text-2xl font-black uppercase tracking-wide">
                                    {userName}
                                </span>
                            </motion.div>

                            {/* Role Label */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-[#94a3b8] text-[11px] font-bold tracking-[0.25em] mb-10"
                            >
                                {getRoleLabel()}
                            </motion.p>

                            {/* Gradient Progress Bar */}
                            <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-3">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>

                            <p className="text-[#94a3b8] text-xs font-medium italic">
                                Sedang mengalihkan ke dashboard...
                            </p>
                        </div>

                        {/* Subtle background glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-100/30 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LoginSuccessModal;

