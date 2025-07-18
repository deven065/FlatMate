import { FaUsers, FaMoneyBillWave, FaExclamationCircle, FaQuestionCircle } from "react-icons/fa";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const StatCard = ({ icon, label, value, color }) => (
    <div className={`flex items-center gap-4 p-4 rounded-lg bg-[#1f2937] text-white shadow-md w-full max-w-[220px]`}>
        <div className={`texy-2xl ${color}`}>{icon}</div>
        <div>
            <div className="text-sm text-gray-400">{label}</div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    </div>
);

export default function DashboardStats() {
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalCollected: 0,
        totalDues: 0,
        openQueries: 0,
    });

    useEffect(() => {
        const membersRef = ref(db, "members");
        const queriesRef = ref(db, "queries");

        onValue(membersRef, (snapshot) => {
        let members = snapshot.val();
        let totalMembers = 0;
        let totalCollected = 0;
        let totalDues = 0;

        for (let id in members) {
            totalMembers++;
            totalCollected += Number(members[id].paid || 0);
            totalDues += Number(members[id].dues || 0);
        }

        setStats((prev) => ({ ...prev, totalMembers, totalCollected, totalDues }));
        });

        onValue(queriesRef, (snapshot) => {
        let data = snapshot.val();
        let openQueries = 0;

        for (let id in data) {
            if (data[id].status === "open") openQueries++;
        }

        setStats((prev) => ({ ...prev, openQueries }));
        });
    }, []);

    return (
        <div className="flex flex-wrap gap-4">
        <StatCard
            icon={<FaUsers />}
            label="Total Members"
            value={stats.totalMembers}
            color="text-blue-500"
        />
        <StatCard
            icon={<FaMoneyBillWave />}
            label="Total Collected"
            value={`₹${stats.totalCollected.toLocaleString()}`}
            color="text-green-500"
        />
        <StatCard
            icon={<FaExclamationCircle />}
            label="Outstanding Dues"
            value={`₹${stats.totalDues.toLocaleString()}`}
            color="text-red-500"
        />
        <StatCard
            icon={<FaQuestionCircle />}
            label="Open Queries"
            value={stats.openQueries}
            color="text-yellow-500"
        />
        </div>
    );
}