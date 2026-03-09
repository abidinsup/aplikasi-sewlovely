"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, CheckCircle2, ShieldCheck, UserCircle2 } from "lucide-react";

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            setProgress(0);
            const timer = setInterval(() => {
                setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
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

    if (!mounted) return null;

    const getRoleIcon = () => {
        switch (role) {
            case "Owner": return <Crown className="w-10 h-10 text-purple-500" />;
            case "Admin": return <ShieldCheck className="w-10 h-10 text-purple-500" />;
            default: return <UserCircle2 className="w-10 h-10 text-purple-500" />;
        }
    };

    const getRoleLabel = () => {
        switch (role) {
            case "Owner": return "OWNER / SUPER ADMIN";
            case "Admin": return "ADMINISTRATOR SYSTEM";
            default: return "MITRA AFFILIATE RESMI";
        }
    };

    const modalLayout = (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto'
                    }}
                >
                    {/* Final Defense Backdrop: Hard-coded Dark Blurred Background */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            backdropFilter: 'blur(40px)',
                            WebkitBackdropFilter: 'blur(40px)',
                            zIndex: -1
                        }}
                    />

                    {/* Highly Centered Content Card */}
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 15 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                            position: 'relative',
                            width: '90%',
                            maxWidth: '400px',
                            backgroundColor: 'white',
                            borderRadius: '3.5rem',
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                            {/* Icon Section */}
                            <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                <motion.div
                                    initial={{ rotate: -15, scale: 0.7 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", delay: 0.1, damping: 15 }}
                                    style={{
                                        display: 'flex',
                                        height: '7rem',
                                        width: '7rem',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '2.5rem',
                                        backgroundColor: 'white',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                                        border: '1px solid #f3e8ff'
                                    }}
                                >
                                    {getRoleIcon()}
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0, x: 10, y: 10 }}
                                    animate={{ scale: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    style={{
                                        position: 'absolute',
                                        right: '-0.5rem',
                                        bottom: '-0.5rem',
                                        display: 'flex',
                                        height: '2.75rem',
                                        width: '2.75rem',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '9999px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                                        border: '4px solid white'
                                    }}
                                >
                                    <CheckCircle2 style={{ width: '1.5rem', height: '1.5rem' }} />
                                </motion.div>
                            </div>

                            {/* Text Section */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.1, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                                    Berhasil Masuk!
                                </h2>
                                <p style={{ fontSize: '1.25rem', fontWeight: 500, color: '#64748b' }}>
                                    Selamat datang kembali,
                                </p>
                            </div>

                            {/* Name Badge */}
                            <div style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '2.5rem',
                                backgroundColor: '#f5f3ff',
                                marginBottom: '1.5rem',
                                border: '1px solid #ddd6fe'
                            }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {userName}
                                </span>
                            </div>

                            {/* Role Label */}
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.3em', marginBottom: '2.5rem', textTransform: 'uppercase' }}>
                                {getRoleLabel()}
                            </p>

                            {/* Progress Bar Container */}
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <motion.div
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7, #d946ef)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>

                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>
                                Sedang mengalihkan ke dashboard...
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalLayout, document.body);
};

export default LoginSuccessModal;
