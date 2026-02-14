
"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';

const SessionTimeoutContext = createContext<null>(null);

// 30 minutes in milliseconds
const TIMEOUT_DURATION = 30 * 60 * 1000;

export const SessionTimeoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/';

    const handleLogout = useCallback(async () => {
        if (isPublicPage) return;

        await logout();
        toast.warning("Sesi Berakhir", {
            description: "Anda telah otomatis keluar karena tidak ada aktivitas selama 30 menit."
        });
        router.push('/login?reason=timeout');
    }, [router, isPublicPage]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (!isPublicPage) {
            timeoutRef.current = setTimeout(handleLogout, TIMEOUT_DURATION);
        }
    }, [handleLogout, isPublicPage]);

    useEffect(() => {
        // Events to monitor for activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => resetTimer();

        // Initial set
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            // Clean up
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return (
        <SessionTimeoutContext.Provider value={null}>
            {children}
        </SessionTimeoutContext.Provider>
    );
};

export const useSessionTimeout = () => useContext(SessionTimeoutContext);
