import {
  FaUsers,
  FaMoneyBillWave,
  FaExclamationCircle,
  FaQuestionCircle,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";

const StatCard = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#1f2937] text-gray-800 dark:text-white shadow-md w-full">
    <div className={`text-2xl ${color}`}>{icon}</div>
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
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
    const usersRef = ref(db, "users");
    const membersRef = ref(db, "members");
    const queriesRef = ref(db, "queries");

    let totalMembers = 0;
    let totalCollected = 0;
    let totalDues = 0;

    // 🔹 FETCH FROM users NODE
    onValue(usersRef, (snapshot) => {
      const users = snapshot.val() || {};

      Object.values(users).forEach((user) => {
        if (user.role === "member") {
          totalMembers++;
          totalCollected += Number(user.paid || 0);
          totalDues += Number(user.dues || 0);
        }
      });

      // 🔹 FETCH FROM members NODE
      onValue(membersRef, (snapshot) => {
        const members = snapshot.val() || {};

        Object.values(members).forEach((member) => {
          totalMembers++;
          totalCollected += Number(member.paid || 0);
          totalDues += Number(member.dues || 0);
        });

        setStats((prev) => ({
          ...prev,
          totalMembers,
          totalCollected,
          totalDues,
        }));
      });
    });

    // 🔹 FETCH OPEN QUERIES
    onValue(queriesRef, (snapshot) => {
      const data = snapshot.val() || {};
      let openQueries = 0;

      Object.values(data).forEach((query) => {
        if (query.status === "open") openQueries++;
      });

      setStats((prev) => ({ ...prev, openQueries }));
    });
  }, []);

  return (
    <div className="flex flex-row justify-between gap-4 w-full flex-wrap xl:flex-nowrap">
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
