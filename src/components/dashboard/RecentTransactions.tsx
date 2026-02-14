import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

const recentActivity = [
    {
        id: "TRX-9821",
        customer: "Budi Santoso",
        product: "Homeset Emerald Luxury",
        date: "2 jam yang lalu",
        amount: "Rp 150.000",
        status: "Selesai",
        type: "commission"
    },
    {
        id: "TRX-9820",
        customer: "Ani Lestari",
        product: "Sprei King Size - Floral",
        date: "5 jam yang lalu",
        amount: "Rp 75.000",
        status: "Pending",
        type: "commission"
    },
    {
        id: "WD-003",
        customer: "Withdrawal",
        product: "Transfer ke BCA",
        date: "1 hari yang lalu",
        amount: "Rp 500.000",
        status: "Sukses",
        type: "withdrawal"
    },
];

export function RecentTransactions() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Aktivitas Terbaru</h3>
                <button className="text-sm text-emerald-600 font-medium hover:underline flex items-center">
                    Lihat Semua <ArrowUpRight className="ml-1 h-3 w-3" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">Transaksi / Produk</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Waktu</th>
                            <th className="px-6 py-4 font-medium text-right">Nilai Komisi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {recentActivity.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${item.type === 'withdrawal' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {item.type === 'withdrawal' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.customer}</p>
                                            <p className="text-xs text-gray-500">{item.product}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${item.status === 'Selesai' || item.status === 'Sukses' ? 'bg-green-100 text-green-800' :
                                            item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {item.date}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                    {item.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
