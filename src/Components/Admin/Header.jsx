import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

import {
    FaBuilding,
    FaUsers,
    FaMoneyBill,
    FaReceipt,
    FaBullhorn,
    FaQuestionCircle,
    FaMoon,
    FaBell,
    FaUserCircle,
    FaSignOutAlt,
} from "react-icons/fa";

export default function Header() {
    const [userData, setUserData] = useState({ fullName: "", role: "" });
    const location = useLocation();
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = ref(db, `users/${user.uid}`);
            onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setUserData({
                fullName: data.fullName,
                role: data.role,
                });
            }
            });
        }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        signOut(auth)
        .then(() => {
            navigate("/login");
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
    };

    const navItems = [
        { label: "Dashboard", icon: <FaBuilding />, path: "/dashboard" },
        { label: "Members", icon: <FaUsers />, path: "/members" },
        { label: "Payments", icon: <FaMoneyBill />, path: "/payments" },
        { label: "Receipts", icon: <FaReceipt />, path: "/receipts" },
        { label: "Notices", icon: <FaBullhorn />, path: "/notices" },
        { label: "Queries", icon: <FaQuestionCircle />, path: "/queries" },
    ];

    return (
        <div className="flex justify-between items-center px-6 py-2 bg-[#1f2937] text-white shadow-md">
        {/* Logo */}
        <div className="flex items-center gap-2 text-lg font-semibold">
            <FaBuilding className="text-blue-400" />
            <span>Society Maintenance</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
            {navItems.map((item) => (
            <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                location.pathname === item.path ? "bg-[#374151]" : ""
                } hover:bg-[#374151] transition`}
            >
                {item.icon}
                <span className="text-sm">{item.label}</span>
            </Link>
            ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 text-sm">
            <FaMoon className="cursor-pointer text-gray-400 hover:text-white" />
            <FaBell className="cursor-pointer text-gray-400 hover:text-white" />
            <FaUserCircle className="text-xl text-gray-300" />
            <div className="flex flex-col text-right">
            <span className="font-medium">{userData.fullName || "Admin User"}</span>
            <span className="text-xs text-gray-400 capitalize">{userData.role || "admin"}</span>
            </div>
            <FaSignOutAlt
            className="text-gray-400 hover:text-red-400 cursor-pointer"
            onClick={handleLogout}
            title="Logout"
            />
        </div>
        </div>
    );
}
