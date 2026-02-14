import React from "react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

export function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    {icon && <div className="flex justify-center mb-6">{icon}</div>}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="glass-effect rounded-2xl p-8 shadow-sm ring-1 ring-gray-900/5">
                    {children}
                </div>
            </div>
        </div>
    );
}
