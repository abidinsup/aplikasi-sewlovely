import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    gradient?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, gradient }: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
                    {(description || trend) && (
                        <div className="flex items-center mt-2 space-x-2">
                            {trend && (
                                <span className={cn(
                                    "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center",
                                    trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                )}>
                                    {trend.positive ? "+" : ""}{trend.value}
                                </span>
                            )}
                            {description && (
                                <span className="text-xs text-gray-400">{description}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl shadow-inner",
                    gradient ? gradient : "bg-gray-50 text-gray-600"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
