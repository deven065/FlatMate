import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { FaDownload, FaEye } from "react-icons/fa";

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
    return (
        <div className="bg-[#1f2937] rounded-lg shadow p-4 text-white">
            <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-[#374151] text-left text-gray-300">
                            <th className="p-2">Member</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Receipt</th>
                            <th className="p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-100">
                        {payments.map((p) => (
                            <tr key={p.id} className="border-t border-gray-700 hover:bg-[#2d3748]">
                                <td className="p-2 font-semibold">
                                    {p.member} ({p.flat})
                                </td>
                                <td>{p.date}</td>
                                <td>{p.amount}</td>
                                <td>{p.receipt}</td>
                                <td>
                                    <FaEye className="cursor-pointer hover:text-blue-600" title="View" />
                                    <FaDownload className="cursor-pointer hover:text-blue-600" title="Download" />
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400">
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