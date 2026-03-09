
"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import InactivityWarningModal from '@/components/auth/InactivityWarningModal';

const SessionTimeoutContext = createContext<null>(null);

// Configuration
// 14 minutes = 14 * 60 * 1000 ms
const INACTIVITY_LIMIT = 14 * 60 * 1000;
// 60 seconds countdown
const COUNTDOWN_DURATION = 60;

export const SessionTimeoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [showWarning, setShowWarning] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_DURATION);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/';

    const handleLogout = useCallback(async (isAuto = true) => {
        if (isPublicPage) return;

        // Clear all timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        setShowWarning(false);

        await logout();

        if (isAuto) {
            toast.error("Sesi Berakhir Otomatis", {
                description: "Anda telah keluar karena tidak ada aktivitas selama 15 menit demi keamanan."
            });
        } else {
            toast.success("Berhasil Keluar", {
                description: "Anda telah keluar dari sistem secara aman."
            });
        }

        router.push('/login?reason=timeout');
    }, [router, isPublicPage]);

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

        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => {
            // Only reset if we're not already showing the warning
            if (!showWarning) {
                resetTimer();
            }
        };

        // Initial set
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            // Clean up
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer, isPublicPage, showWarning]);

    const handleModalAction = (stayActive: boolean) => {
        if (stayActive) {
            resetTimer();
        } else {
            handleLogout(false);
        }
    };

    return (
        <SessionTimeoutContext.Provider value={null}>
            {children}
            <InactivityWarningModal
                isOpen={showWarning}
                onClose={handleModalAction}
                secondsRemaining={secondsRemaining}
            />
        </SessionTimeoutContext.Provider>
    );
};

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

