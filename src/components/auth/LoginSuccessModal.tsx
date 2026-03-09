"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, UserCircle2, UserCheck } from "lucide-react";

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
                    return prev + 2;
                });
            }, 30);

            const closeTimer = setTimeout(() => {
                onClose();
            }, 2000);

            return () => {
                clearInterval(timer);
                clearTimeout(closeTimer);
            };
        }
    }, [isOpen, onClose]);

    const getRoleIcon = () => {
        switch (role) {
            case "Owner":
                return <ShieldCheck className="w-12 h-12 text-amber-400" />;
            case "Admin":
                return <UserCheck className="w-12 h-12 text-blue-400" />;
            default:
                return <UserCircle2 className="w-12 h-12 text-emerald-400" />;
        }
    };

    const getRoleLabel = () => {
        switch (role) {
            case "Owner":
                return "Owner Dashboard";
            case "Admin":
                return "Admin Panel";
            default:
                return "Mitra Affiliate";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Blur Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl"
                    >
                        {/* Glossy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            {/* Success Icon Animation */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    delay: 0.2,
                                    stiffness: 260,
                                    damping: 20,
                                }}
                                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-xl"
                            >
                                <div className="relative">
                                    {getRoleIcon()}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </motion.div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Login Berhasil!
                                </h2>
                                <p className="text-white/80 text-lg mb-1">
                                    Selamat datang kembali,
                                </p>
                                <p className="text-white font-semibold text-xl mb-4 truncate">
                                    {userName}
                                </p>

                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/90 text-sm font-medium mb-8">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                                    {getRoleLabel()}
                                </div>
                            </motion.div>

                            {/* Progress Bar Loader */}
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-2 text-white/40 text-[10px] tracking-widest uppercase font-semibold">
                                Memuat data sasuai role...
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LoginSuccessModal;
