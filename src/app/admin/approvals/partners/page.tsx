"use client";

import * as React from "react";
import { Check, X, Phone, CreditCard, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { getPartnerRequests, approvePartnerRequest, rejectPartnerRequest } from "@/lib/commission";

/* 
// Mock Data (Removed)
const initialRequests = ... 
*/

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PartnerApprovalsPage() {
    const [requests, setRequests] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [selectedRequest, setSelectedRequest] = React.useState<any | null>(null);
    const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        const result = await getPartnerRequests();
        if (result.success && result.data) {
            setRequests(result.data.map((req: any) => ({
                id: req.id,
                date: new Date(req.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }),
                partnerName: req.partners?.full_name || "Unknown",
                partnerCode: req.partners?.affiliate_code || "-",
                partnerId: req.partner_id, // Needed for approval
                type: req.type,
                oldData: formatData(req.type, req.old_data),
                newData: formatData(req.type, req.new_data),
                rawNewData: req.new_data, // Keep raw for update
                status: req.status
            })));
        } else {
            toast.error("Gagal mengambil data request");
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatData = (type: string, data: string) => {
        if (!data) return "-";
        if (type === 'phone') return data;
        if (type === 'bank') {
            try {
                const parsed = JSON.parse(data);
                return `${parsed.bank_name} ${parsed.account_number} a.n ${parsed.account_holder}`;
            } catch (e) {
                return data; // Fallback if not JSON
            }
        }
        return data;
    };

    const onActionClick = (request: any, type: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(type);
        setConfirmOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedRequest || !actionType) return;

        if (actionType === 'approve') {
            const result = await approvePartnerRequest(
                selectedRequest.id,
                selectedRequest.partnerId,
                selectedRequest.type,
                selectedRequest.rawNewData
            );
            if (result.success) {
                toast.success("Perubahan data disetujui");
                fetchData();
            } else {
                toast.error("Gagal menyetujui request", { description: result.error });
            }
        } else {
            const result = await rejectPartnerRequest(selectedRequest.id);
            if (result.success) {
                toast.info("Perubahan data ditolak");
                fetchData();
            } else {
                toast.error("Gagal menolak request", { description: result.error });
            }
        }
        setConfirmOpen(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Approval Data Mitra</h1>
                <p className="text-slate-500">Tinjau dan setujui permintaan perubahan data dari mitra.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500">Tanggal</th>
                                <th className="px-6 py-4 font-bold text-slate-500">Mitra</th>
                                <th className="px-6 py-4 font-bold text-slate-500">Jenis Perubahan</th>
                                <th className="px-6 py-4 font-bold text-slate-500">Perubahan</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada permintaan perubahan data.</td></tr>
                            ) : requests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{req.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{req.partnerName}</div>
                                        <div className="text-xs text-slate-400 font-mono">{req.partnerCode}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "p-1.5 rounded-lg",
                                                req.type === 'bank' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                            )}>
                                                {req.type === 'bank' ? <CreditCard className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                                            </div>
                                            <span className="font-medium text-slate-700 capitalize">
                                                {req.type === 'bank' ? 'Rekening Bank' : 'No. WhatsApp'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-red-500 text-xs line-through opacity-60">
                                                <AlertCircle className="h-3 w-3" />
                                                {req.oldData}
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                                                <Check className="h-3 w-3" />
                                                {req.newData}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {req.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onActionClick(req, 'reject')}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => onActionClick(req, 'approve')}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 w-8 p-0 rounded-lg shadow-sm shadow-emerald-600/20"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className={cn(
                                                "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                                                req.status === 'approved'
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-red-100 text-red-700"
                                            )}>
                                                {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${actionType === 'approve' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {actionType === 'approve' ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                <AlertCircle className="h-5 w-5" />
                            )}
                            Konfirmasi {actionType === 'approve' ? 'Persetujuan' : 'Penolakan'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? "Apakah Anda yakin ingin menyetujui perubahan data ini? Data mitra akan diperbarui secara otomatis."
                                : "Apakah Anda yakin ingin menolak perubahan data ini? Mitra akan diminta untuk mengajukan ulang jika diperlukan."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
                        <Button
                            className={actionType === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                            onClick={confirmAction}
                        >
                            Ya, {actionType === 'approve' ? 'Setujui' : 'Tolak'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
