import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { FaDownload, FaEye } from "react-icons/fa";
import jsPDF from "jspdf";

export default function RecentPayments() {
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        const paymentsRef = ref(db, "recentPayments");

        onValue(paymentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loaded = Object.entries(data).map(([id, value]) => ({
                    id,
                    ...value,
                }));
                loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPayments(loaded);
            } else {
                setPayments([]);
            }
        });
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


    return (
        <div className="bg-white dark:bg-[#1f2937] rounded-lg shadow p-4 text-gray-900 dark:text-white">
            <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
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
                        {payments.map((p) => (
                            <tr key={p.id} className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2d3748]">
                                <td className="p-2 font-semibold">
                                    {p.member} ({p.flat})
                                </td>
                                <td className="p-2">{p.date}</td>
                                <td className="p-2">{p.amount}</td>
                                <td className="p-2">{p.receipt}</td>
                                <td className="p-2 flex gap-3">
                                    <FaEye className="cursor-pointer hover:text-blue-600" title="View" />
                                    <FaDownload
                                        className="cursor-pointer hover:text-blue-600"
                                        title="Download"
                                        onClick={() => handleDownload(p)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
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
