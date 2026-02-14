"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => onOpenChange?.(false)}
            />
            {/* Context for Children */}
            <div className="relative z-50 w-full max-w-lg p-4">
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden", className)}>
            {children}
        </div>
    );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("p-6 pb-4", className)}>
            {children}
        </div>
    );
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <h3 className={cn("text-lg font-bold text-slate-900 leading-none tracking-tight", className)}>
            {children}
        </h3>
    );
}

export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("mt-2 text-sm text-slate-500", className)}>
            {children}
        </div>
    );
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("bg-slate-50 p-6 flex items-center justify-end gap-2", className)}>
            {children}
        </div>
    );
}
