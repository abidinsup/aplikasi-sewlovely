
"use client";

import * as React from "react";
import { Trophy, Target, TrendingUp, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ProgressBonusCardProps {
    partnerId: string | undefined;
}

export function ProgressBonusCard({ partnerId }: ProgressBonusCardProps) {
    const [doneCount, setDoneCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const target = 5; // Target bonus 5 pemasangan

    React.useEffect(() => {
        if (partnerId) {
            fetchDoneCount();
        }
    }, [partnerId]);

    const fetchDoneCount = async () => {
        try {
            // Get current week start (Monday)
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(now.setDate(diff));
            monday.setHours(0, 0, 0, 0);

            const { count, error } = await supabase
                .from('survey_schedules')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', partnerId)
                .eq('status', 'done')
                .gte('created_at', monday.toISOString());

            if (!error && count !== null) {
                setDoneCount(count);
            }
        } catch (err) {
            console.error('Error fetching progress count:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const progress = Math.min((doneCount / target) * 100, 100);
    const remaining = Math.max(target - doneCount, 0);

    if (isLoading) return null;

    return (
        <div className="bg-white rounded-[1.5rem] border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Target className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Target Bonus Mingguan</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        {remaining > 0
                            ? `Selesaikan ${remaining} pemasangan lagi untuk klaim bonus Rp 300.000!`
                            : "Selamat! Target tercapai. Bonus Rp 300.000 siap diklaim."}
                    </p>
                </div>

                <div className="flex-1 max-w-md w-full">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Progress: {doneCount}/{target}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000 ease-out rounded-full",
                                progress >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                            )}
                            style={{ width: `${progress}%` }}
                        >
                            {progress > 10 && (
                                <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all",
                        progress >= 100 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-200" : "bg-slate-50 text-slate-300"
                    )}>
                        <Trophy className={cn("h-7 w-7", progress >= 100 ? "animate-bounce" : "")} />
                    </div>
                </div>
            </div>
        </div>
    );
}
