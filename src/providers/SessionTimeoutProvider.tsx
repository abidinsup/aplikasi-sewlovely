
"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, getCurrentPartner, isAdmin } from '@/lib/auth';
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
    const [userRole, setUserRole] = useState<"Owner" | "Admin" | "Mitra">("Mitra");
    const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_DURATION);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/';

    // Synchronize User Info
    const syncUserInfo = useCallback(() => {
        // We sync if NOT on public page, or even if on public page just to have state ready
        const partner = getCurrentPartner();
        const adminStatus = isAdmin();

        if (adminStatus) {
            setUserName("BOS BIDIN");
            setUserRole("Owner");
        } else if (partner) {
            setUserName(partner.full_name || "Mitra");
            setUserRole("Mitra");
        } else {
            setUserName("User");
            setUserRole("Mitra");
        }
    }, []);

    // Initial sync and on route change
    useEffect(() => {
        syncUserInfo();
    }, [pathname, syncUserInfo]);

    const handleLogout = useCallback(async (isAuto = true) => {
        if (isPublicPage) return;

        // Perform one last sync to get the absolute latest from localStorage
        const partner = getCurrentPartner();
        const adminStatus = isAdmin();

        let targetName = "User";
        let targetRole: "Owner" | "Admin" | "Mitra" = "Mitra";

        if (adminStatus) {
            targetName = "BOS BIDIN";
            targetRole = "Owner";
        } else if (partner) {
            targetName = partner.full_name || "Mitra";
            targetRole = "Mitra";
        }

        // Set state first to ensure modal sees it
        setUserName(targetName);
        setUserRole(targetRole);

        // Show Logout Modal
        setShowLogoutModal(true);

        // Clear all timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        setShowWarning(false);

        // Actual logout (awaiting it after showing modal)
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
                role={userRole}
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


