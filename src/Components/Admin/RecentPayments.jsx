import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { FaDownload, FaEye, FaFileExport } from "react-icons/fa";
import jsPDF from "jspdf";
import { openReceiptPrintWindow } from "../../utils/receipt";

export default function RecentPayments() {
    const [payments, setPayments] = useState([]);
    const [search, setSearch] = useState("");
    const [method, setMethod] = useState("All");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        const paymentsRef = ref(db, "recentPayments");
        const unsub = onValue(paymentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loaded = Object.entries(data).map(([id, value]) => ({ id, ...value }));
                loaded.sort((a, b) => {
                    const ta = a.createdAt ?? new Date(a.date).getTime();
                    const tb = b.createdAt ?? new Date(b.date).getTime();
                    return tb - ta;
                });
                setPayments(loaded);
            } else {
                setPayments([]);
            }
        });
        return () => unsub();
    }, []);

    const handleDownload = (payment) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("FlatMate Maintenance Receipt", 20, 20);

        doc.setFontSize(12);
        doc.text(`Receipt No: ${payment.receipt}`, 20, 40);
        doc.text(`Date: ${payment.date}`, 20, 48);
        doc.text(`Member: ${payment.member}`, 20, 56);
        doc.text(`Flat No: ${payment.flat}`, 20, 64);
        doc.text(`Email: ${payment.email || "N/A"}`, 20, 72);
        doc.text(`Amount Paid: ₹${payment.amount}`, 20, 80);

        doc.setFontSize(10);
        doc.text("Thank you for your payment!", 20, 100);

        doc.save(`receipt-${payment.receipt}.pdf`);
    };

    const handleView = (payment) => {
        openReceiptPrintWindow(payment);
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const fromTs = fromDate ? new Date(fromDate).setHours(0,0,0,0) : null;
        const toTs = toDate ? new Date(toDate).setHours(23,59,59,999) : null;
        return payments.filter(p => {
            // search
            const txt = `${p.member||""} ${p.flat||""} ${p.email||""} ${p.receipt||""}`.toLowerCase();
            if (q && !txt.includes(q)) return false;
            // method
            if (method !== 'All' && (p.method || 'Unknown') !== method) return false;
            // date range
            const ts = p.createdAt ?? new Date(p.date).getTime();
            if (fromTs && ts < fromTs) return false;
            if (toTs && ts > toTs) return false;
            return true;
        });
    }, [payments, search, method, fromDate, toDate]);

    const totals = useMemo(() => {
        const sum = filtered.reduce((s, p) => s + (Number(p.amount)||0), 0);
        return { count: filtered.length, amount: sum };
    }, [filtered]);

    const exportCsv = () => {
        const rows = filtered.map(p => ({
            Date: p.date,
            Member: p.member,
            Flat: p.flat,
            Email: p.email || '',
            Amount: Number(p.amount)||0,
            Method: p.method || '',
            Receipt: p.receipt || ''
        }));
        const headers = Object.keys(rows[0] || {Date:'', Member:'', Flat:'', Email:'', Amount:0, Method:'', Receipt:''});
        const csv = [
            headers.join(','),
            ...rows.map(r => headers.map(h => String(r[h]).replaceAll('"','""')).join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recent-payments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="bg-white dark:bg-[#1f2937] rounded-lg shadow p-4 text-gray-900 dark:text-white">
            <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>

            <div className="grid gap-3 sm:grid-cols-4 grid-cols-1 mb-3">
                <input
                    className="bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded outline-none"
                    placeholder="Search name/flat/email/receipt"
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                />
                <select
                    className="bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded outline-none"
                    value={method}
                    onChange={(e)=>setMethod(e.target.value)}
                >
                    <option>All</option>
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                    <option>Manual Edit</option>
                </select>
                <input type="date" className="bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded outline-none" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
                <div className="flex gap-2">
                    <input type="date" className="bg-gray-100 dark:bg-[#374151] px-3 py-2 rounded outline-none w-full" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
                    <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-sm">
                        <FaFileExport /> Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Count</div>
                    <div className="text-lg font-semibold">{totals.count}</div>
                </div>
                <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Amount</div>
                    <div className="text-lg font-semibold">₹{Number(totals.amount).toLocaleString('en-IN')}</div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-[#374151] text-left text-gray-700 dark:text-gray-300">
                            <th className="p-2">Member</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Receipt</th>
                            <th className="p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                        {filtered.map((p) => (
                            <tr key={p.id} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2d3748]">
                                <td className="p-2 font-semibold">
                                    {p.member} ({p.flat})
                                </td>
                                <td className="p-2">{p.date}</td>
                                <td className="p-2">{p.amount}</td>
                                <td className="p-2">{p.receipt}</td>
                                <td className="p-2 flex gap-3">
                                    <FaEye className="cursor-pointer hover:text-blue-600" title="View" onClick={() => handleView(p)} />
                                    <FaDownload
                                        className="cursor-pointer hover:text-blue-600"
                                        title="Download"
                                        onClick={() => handleDownload(p)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400 dark:text-gray-500">
                                    No payments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
