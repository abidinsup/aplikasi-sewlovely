"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AppSettingsContextType {
    appName: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    isMounted: boolean;
    sliderBadge: string;
    sliderTitle: string;
    sliderDescription: string;
    sliderHighlight: string;
    refreshSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
    appName: "Sewlovely Homeset",
    bankName: "BCA",
    bankAccountNumber: "8830-123-456",
    bankAccountHolder: "SEWLOVELY HOMESET",
    isMounted: false,
    sliderBadge: "Info Mitra",
    sliderTitle: "Raih Bonusnya! Selesaikan 5 Pemasangan",
    sliderDescription: "Selesaikan 5 pemasangan minggu ini dan dapatkan bonus komisi tambahan",
    sliderHighlight: "Rp 300.000",
    refreshSettings: async () => { },
});

export const useAppSettings = () => useContext(AppSettingsContext);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);
    const [appName, setAppName] = useState<string>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem("app_name") || "Sewlovely Homeset";
        return "Sewlovely Homeset";
    });
    const [bankName, setBankName] = useState<string>("BCA");
    const [bankAccountNumber, setBankAccountNumber] = useState<string>("8830-123-456");
    const [bankAccountHolder, setBankAccountHolder] = useState<string>("SEWLOVELY HOMESET");
    const [sliderBadge, setSliderBadge] = useState<string>("Info Mitra");
    const [sliderTitle, setSliderTitle] = useState<string>("Raih Bonusnya! Selesaikan 5 Pemasangan");
    const [sliderDescription, setSliderDescription] = useState<string>("Selesaikan 5 pemasangan minggu ini dan dapatkan bonus komisi tambahan");
    const [sliderHighlight, setSliderHighlight] = useState<string>("Rp 300.000");

    // Sync with Supabase in background and handle real-time updates
    useEffect(() => {
        setIsMounted(true);
        fetchSettings();

        const handleUpdate = () => fetchSettings();
        window.addEventListener("app-settings-updated", handleUpdate);
        return () => window.removeEventListener("app-settings-updated", handleUpdate);
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('key, value');

            if (data) {
                const name = data.find(i => i.key === 'app_name');
                const newName = name?.value || "Sewlovely Homeset";
                setAppName(newName);
                localStorage.setItem("app_name", newName);

                const bank = data.find(i => i.key === 'bank_name');
                const account = data.find(i => i.key === 'bank_account_number');
                const holder = data.find(i => i.key === 'bank_account_holder');

                const sBadge = data.find(i => i.key === 'slider_badge');
                const sTitle = data.find(i => i.key === 'slider_title');
                const sDesc = data.find(i => i.key === 'slider_description');
                const sHigh = data.find(i => i.key === 'slider_highlight');

                if (bank) setBankName(bank.value);
                if (account) setBankAccountNumber(account.value);
                if (holder) setBankAccountHolder(holder.value);
                if (sBadge) setSliderBadge(sBadge.value);
                if (sTitle) setSliderTitle(sTitle.value);
                if (sDesc) setSliderDescription(sDesc.value);
                if (sHigh) setSliderHighlight(sHigh.value);
            }

        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    return (
        <AppSettingsContext.Provider value={{
            appName,
            bankName,
            bankAccountNumber,
            bankAccountHolder,
            isMounted,
            sliderBadge,
            sliderTitle,
            sliderDescription,
            sliderHighlight,
            refreshSettings: fetchSettings
        }}>
            {children}
        </AppSettingsContext.Provider>
    );
}
