import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { FaDownload, FaEye, FaFileExport, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import jsPDF from "jspdf";
import { openReceiptPrintWindow } from "../../utils/receipt";
import { useToast } from "../Toast/useToast";

export default function RecentPayments() {
    const { push: pushToast } = useToast();
    const [payments, setPayments] = useState([]);
    const [search, setSearch] = useState("");
    // helper: current week (Mon-Sun)
    const getWeekRange = () => {
        const now = new Date();
        const day = now.getDay(); // 0=Sun,1=Mon,...
        const diffToMonday = (day + 6) % 7; // Mon->0, Sun->6
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
        };
        return { from: fmt(monday), to: fmt(sunday) };
    };
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showFilters, setShowFilters] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [loading, setLoading] = useState(true);
    const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
    const formatDateTime = (p) => {
        const ts = p.createdAt ?? new Date(p.date).getTime();
        const d = new Date(ts);
        if (Number.isNaN(d.getTime())) return p.date || '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    };

    const MethodBadge = ({ method }) => {
        const m = (method || 'Unknown').toLowerCase();
        const map = {
            upi: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300/50',
            cash: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300/50',
            card: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 border border-indigo-300/50',
            'bank transfer': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border border-sky-300/50',
            'manual edit': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-300/50',
            unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 border border-gray-300/50',
        };
        const cls = map[m] || map.unknown;
        return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cls}`}>{method || 'Unknown'}</span>;
    };

    const LateBadge = ({ p }) => {
        const late = Boolean(p.wasLatePayment) || Number(p.lateFeeAddedToDues) > 0;
        if (!late) return null;
        return <span className="ml-2 px-2 py-0.5 text-xs rounded-full font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 border border-rose-300/50">Late</span>;
    };

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
            setLoading(false);
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

    const handleCopyReceipt = async (receipt) => {
        try {
            await navigator.clipboard.writeText(String(receipt || ""));
            pushToast({ type: 'success', title: 'Copied', description: 'Receipt number copied' });
        } catch {
            pushToast({ type: 'error', title: 'Copy failed' });
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const fromTs = fromDate ? new Date(fromDate).setHours(0,0,0,0) : null;
        const toTs = toDate ? new Date(toDate).setHours(23,59,59,999) : null;
        return payments.filter(p => {
            // search
            const txt = `${p.member||""} ${p.flat||""} ${p.email||""} ${p.receipt||""}`.toLowerCase();
            if (q && !txt.includes(q)) return false;
            // date range
            const ts = p.createdAt ?? new Date(p.date).getTime();
            if (fromTs && ts < fromTs) return false;
            if (toTs && ts > toTs) return false;
            return true;
        });
    }, [payments, search, fromDate, toDate]);

    // reset page when filters change
    useEffect(() => { setPage(1); }, [search, fromDate, toDate]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paged = filtered.slice(startIdx, endIdx);

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
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Recent Payments</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Filter, review, and export recent maintenance receipts.</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded px-2 py-1"
                    onClick={() => setShowFilters(v => !v)}
                    aria-expanded={showFilters}
                    aria-controls="filters-panel"
                    title="Toggle filters"
                >
                    <FaFilter />
                    <span>Filters</span>
                </button>
            </div>
            {/* Filters panel */}
            {showFilters && (
            <div id="filters-panel" className="mb-4 rounded-md border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-[#111827] p-3">
                <div className="grid gap-2 sm:grid-cols-6 grid-cols-1 items-center">
                    <div className="sm:col-span-3">
                        <input
                            className="bg-white dark:bg-[#1f2937] px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 outline-none w-full min-w-0"
                            placeholder="Search name/flat/email/receipt"
                            aria-label="Search payments"
                            value={search}
                            onChange={(e)=>setSearch(e.target.value)}
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <input type="date" aria-label="From date" className="bg-white dark:bg-[#1f2937] px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 outline-none w-full min-w-0" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                        <div className="flex flex-wrap gap-2 min-w-0 items-center">
                            <input type="date" aria-label="To date" className="bg-white dark:bg-[#1f2937] px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 outline-none w-full min-w-0" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
                            <button
                                onClick={() => { const w = getWeekRange(); setFromDate(w.from); setToDate(w.to); }}
                                className="shrink-0 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-xs"
                                title="Set to this week"
                            >This Week</button>
                            <button
                                onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }}
                                className="shrink-0 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] text-xs"
                                title="Reset filters"
                            >Reset</button>
                            <button onClick={exportCsv} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#232e3c] text-xs">
                                <FaFileExport /> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3 border border-gray-200/60 dark:border-gray-700/60">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Count</div>
                    <div className="text-lg font-semibold">{totals.count}</div>
                </div>
                <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3 border border-gray-200/60 dark:border-gray-700/60">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Amount</div>
                    <div className="text-lg font-semibold">{formatCurrency(totals.amount)}</div>
                </div>
                <div className="rounded-md bg-gray-100 dark:bg-[#374151] p-3 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Showing</span>
                    <span className="font-semibold">{filtered.length ? `${startIdx + 1}-${Math.min(endIdx, filtered.length)} of ${filtered.length}` : '0 of 0'}</span>
                </div>
            </div>
            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-md bg-gray-100 dark:bg-[#374151] p-3 animate-pulse">
                            <div className="h-4 bg-gray-300/60 dark:bg-gray-600/60 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-gray-300/60 dark:bg-gray-600/60 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            )}

            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
                {!loading && paged.map((p) => (
                    <div key={p.id} className="rounded-md bg-gray-100 dark:bg-[#374151] p-3 border border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="font-semibold truncate flex items-center">
                                    <span className="truncate">{p.member}</span>
                                    <LateBadge p={p} />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Flat {p.flat} • {formatDateTime(p)}</div>
                                <div className="mt-1"><MethodBadge method={p.method} /></div>
                            </div>
                            <div className="text-right font-semibold">{formatCurrency(p.amount)}</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <button className="font-mono truncate text-left" title="Click to copy receipt" onClick={() => handleCopyReceipt(p.receipt)} aria-label="Copy receipt">
                                {p.receipt}
                            </button>
                            <div className="flex gap-3">
                                <FaEye className="cursor-pointer hover:text-blue-600" title="View" aria-label="View receipt" onClick={() => handleView(p)} />
                                <FaDownload className="cursor-pointer hover:text-blue-600" title="Download" aria-label="Download receipt" onClick={() => handleDownload(p)} />
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="p-4 text-center text-gray-400 dark:text-gray-500">No payments found.</div>
                )}
            </div>

            {/* Desktop/tablet table */}
            <div className="hidden sm:block overflow-x-auto rounded-md border border-gray-200/60 dark:border-gray-700/60">
                <table className="min-w-full text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-200 dark:bg-[#2a3442] text-left text-gray-700 dark:text-gray-300 sticky top-0 z-10">
                            <th className="p-2 w-4/12">Member</th>
                            <th className="p-2 w-[150px]">Date</th>
                            <th className="p-2 w-[120px] text-right">Amount</th>
                            <th className="p-2 w-[120px]">Method</th>
                            <th className="p-2 w-[140px]">Receipt</th>
                            <th className="p-2 w-[84px]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-900 dark:text-gray-100">
                        {paged.map((p, idx) => (
                            <tr key={p.id} className={`border-t border-gray-300 dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-[#1f2937]' : 'bg-gray-50 dark:bg-[#162132]'} hover:bg-gray-100 dark:hover:bg-[#2d3748]`}>
                                <td className="p-2 font-semibold min-w-0">
                                    <div className="truncate flex items-center" title={`${p.member} (${p.flat})`}>
                                        <span className="truncate">{p.member} ({p.flat})</span>
                                        <LateBadge p={p} />
                                    </div>
                                </td>
                                <td className="p-2 whitespace-nowrap">{formatDateTime(p)}</td>
                                <td className="p-2 whitespace-nowrap text-right">{formatCurrency(p.amount)}</td>
                                <td className="p-2 whitespace-nowrap"><MethodBadge method={p.method} /></td>
                                <td className="p-2 whitespace-nowrap font-mono min-w-0">
                                    <button className="truncate text-left w-full" title="Click to copy receipt" onClick={() => handleCopyReceipt(p.receipt)} aria-label="Copy receipt">
                                        {p.receipt}
                                    </button>
                                </td>
                                <td className="p-2">
                                    <div className="flex justify-end gap-2">
                                        <FaEye className="cursor-pointer hover:text-blue-600" title="View" aria-label="View receipt" onClick={() => handleView(p)} />
                                    <FaDownload
                                        className="cursor-pointer hover:text-blue-600"
                                            title="Download"
                                            aria-label="Download receipt"
                                        onClick={() => handleDownload(p)}
                                    />
                                    </div>
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
            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-3 text-sm">
                <div className="text-gray-500 dark:text-gray-400">Page {page} of {pageCount}</div>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] disabled:opacity-50"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    ><FaChevronLeft /> Prev</button>
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gray-100 dark:bg-[#374151] hover:bg-gray-200 dark:hover:bg-[#4b5563] disabled:opacity-50"
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={page >= pageCount}
                    >Next <FaChevronRight /></button>
                </div>
            </div>
        </div>
    );
}
