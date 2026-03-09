
"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, getCurrentPartner } from '@/lib/auth';
import { toast } from 'sonner';
import InactivityWarningModal from '@/components/auth/InactivityWarningModal';
import LogoutSuccessModal from '@/components/auth/LogoutSuccessModal';

interface SessionTimeoutContextType {
    triggerLogout: () => Promise<void>;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(null);

// Configuration
const INACTIVITY_LIMIT = 14 * 60 * 1000;
const COUNTDOWN_DURATION = 60;

export const SessionTimeoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [showWarning, setShowWarning] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [userName, setUserName] = useState("User");
    const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_DURATION);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/';

    const handleLogout = useCallback(async (isAuto = true) => {
        if (isPublicPage) return;

        // Get name before logout clears it
        const partner = getCurrentPartner();
        setUserName(partner?.full_name || "User");

        // Clear all timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        setShowWarning(false);

        // Show Logout Modal first
        setShowLogoutModal(true);

        // Actual logout
        await logout();

        if (isAuto) {
            toast.error("Sesi Berakhir Otomatis", {
                description: "Anda telah keluar karena tidak ada aktivitas selama 15 menit demi keamanan."
            });
        }
    }, [isPublicPage]);

    const triggerLogout = useCallback(async () => {
        await handleLogout(false);
    }, [handleLogout]);

    const startCountdown = useCallback(() => {
        setShowWarning(true);
        setSecondsRemaining(COUNTDOWN_DURATION);

        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    handleLogout(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleLogout]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        setShowWarning(false);
        setSecondsRemaining(COUNTDOWN_DURATION);

        if (!isPublicPage) {
            timeoutRef.current = setTimeout(startCountdown, INACTIVITY_LIMIT);
        }
    }, [isPublicPage, startCountdown]);

    useEffect(() => {
        if (isPublicPage) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setShowWarning(false);
            return;
        }

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        const handleActivity = () => {
            if (!showWarning && !showLogoutModal) {
                resetTimer();
            }
        };

        resetTimer();

        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [resetTimer, isPublicPage, showWarning, showLogoutModal]);

    const handleModalAction = (stayActive: boolean) => {
        if (stayActive) {
            resetTimer();
        } else {
            handleLogout(false);
        }
    };

    return (
        <SessionTimeoutContext.Provider value={{ triggerLogout }}>
            {children}
            <InactivityWarningModal
                isOpen={showWarning}
                onClose={handleModalAction}
                secondsRemaining={secondsRemaining}
            />
            <LogoutSuccessModal
                isOpen={showLogoutModal}
                onClose={() => {
                    setShowLogoutModal(false);
                    router.push('/login?reason=logout');
                }}
                userName={userName}
            />
        </SessionTimeoutContext.Provider>
    );
};

export const useSessionTimeout = () => {
    const context = useContext(SessionTimeoutContext);
    if (!context) {
        throw new Error("useSessionTimeout must be used within a SessionTimeoutProvider");
    }
    return context;
};


