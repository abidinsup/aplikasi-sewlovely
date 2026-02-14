"use client";

import { Blinds } from "lucide-react";
import * as React from "react";
import { useAppSettings } from "@/providers/AppSettingsProvider";

export function Logo({ className = "w-32 h-auto" }: { className?: string }) {
    const { appName, isMounted } = useAppSettings();

    const displayName = isMounted ? appName : "Sewlovely Homeset";

    return (
        <div className="flex flex-col items-center justify-center space-y-2 text-slate-900">
            <div className="relative h-12 w-12 flex items-center justify-center">
                <Blinds className="h-full w-full text-emerald-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
                {displayName}
            </span>
        </div>
    );
}
