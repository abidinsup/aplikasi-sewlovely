
"use client";

import * as React from "react";
import { Trophy, Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ProgressBonusCardProps {
    partnerId: string | undefined;
}

export function ProgressBonusCard({ partnerId }: ProgressBonusCardProps) {
    const [donePaidCount, setDonePaidCount] = React.useState(0);
    const [totalBonusReceived, setTotalBonusReceived] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const target = 5;

    React.useEffect(() => {
        if (partnerId) {
            fetchProgress();
        }
    }, [partnerId]);

    const fetchProgress = async () => {
        try {
            // 1. Get all done surveys for this partner
            const { data: doneSurveys, error: surveyError } = await supabase
                .from('survey_schedules')
                .select('id')
                .eq('partner_id', partnerId)
                .eq('status', 'done');

            if (surveyError) throw surveyError;

            let paidCount = 0;
            if (doneSurveys && doneSurveys.length > 0) {
                // 2. Count how many have paid invoices
                const surveyIds = doneSurveys.map(s => s.id);
                const { count, error: invError } = await supabase
                    .from('invoices')
                    .select('*', { count: 'exact', head: true })
                    .in('survey_id', surveyIds)
                    .eq('payment_status', 'paid');

                if (!invError && count !== null) {
                    paidCount = count;
                }
            }

            // 3. Count bonuses already received
            const { count: bonusCount, error: txError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', partnerId)
                .eq('type', 'commission')
                .eq('status', 'success')
                .like('description', 'Bonus Otomatis - 5 Projek Selesai%');

            if (!txError && bonusCount !== null) {
                setTotalBonusReceived(bonusCount);
            }

            setDonePaidCount(paidCount);
        } catch (err) {
            console.error('Error fetching progress:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Progress toward next bonus (modulo 5)
    const progressToNext = donePaidCount % target;
    const remaining = target - progressToNext;
    const progress = (progressToNext / target) * 100;
    const justReached = progressToNext === 0 && donePaidCount > 0;

    if (isLoading) return null;

    return (
        <div className="bg-white rounded-[1.5rem] border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Target className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Target Bonus per 5 Projek</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        {justReached
                            ? "🎉 Target tercapai! Bonus Rp 300.000 sudah masuk ke saldo."
                            : `Selesaikan ${remaining} projek lunas lagi untuk bonus Rp 300.000!`}
                    </p>
                    {totalBonusReceived > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Total bonus diterima: {totalBonusReceived}x (Rp {(totalBonusReceived * 300000).toLocaleString('id-ID')})
                        </div>
                    )}
                </div>

                <div className="flex-1 max-w-md w-full">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Progress: {progressToNext}/{target}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000 ease-out rounded-full",
                                justReached ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                            )}
                            style={{ width: `${justReached ? 100 : progress}%` }}
                        >
                            {(progress > 10 || justReached) && (
                                <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all",
                        justReached ? "bg-yellow-400 text-white shadow-lg shadow-yellow-200" : "bg-slate-50 text-slate-300"
                    )}>
                        <Trophy className={cn("h-7 w-7", justReached ? "animate-bounce" : "")} />
                    </div>
                </div>
            </div>
        </div>
    );
}
