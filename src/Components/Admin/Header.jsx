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
    FaSun
} from "react-icons/fa";

export default function Header() {
    const [userData, setUserData] = useState({ fullName: "", role: "" });
    const [isDarkMode, setIsDarkMode] = useState(false);
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

        // Load theme preference on mount
        const savedMode = localStorage.getItem("darkMode") === "true";
        setIsDarkMode(savedMode);
        if (savedMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }

        return () => unsubscribe();
    }, [auth]);

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                navigate("/login");
            })
            .catch((error) => {
                console.error("Logout error:", error);
            });
    };

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem("darkMode", newMode);
        if (newMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
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
        <div className="flex justify-between items-center px-6 py-2 bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white shadow-md">
            {/* Logo */}
            <div className="flex items-center gap-2 text-lg font-semibold">
                <FaBuilding className="text-blue-600 dark:text-blue-400" />
                <span>FlatMate</span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center gap-1 px-2 py-1 rounded
                            ${location.pathname === item.path
                                ? "bg-gray-200 dark:bg-[#374151]"
                                : "hover:bg-gray-200 dark:hover:bg-[#374151]"
                            } transition`}
                    >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4 text-sm">
                {/* Dark Mode Toggle */}
                <button onClick={toggleDarkMode} title="Toggle Dark Mode">
                    {isDarkMode ? (
                        <FaSun className="cursor-pointer text-yellow-400 hover:text-white" />
                    ) : (
                        <FaMoon className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-white" />
                    )}
                </button>

                <FaBell className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-white" />
                <FaUserCircle className="text-xl text-gray-700 dark:text-gray-300" />
                <div className="flex flex-col text-right">
                    <span className="font-medium">{userData.fullName || "Admin User"}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {userData.role || "admin"}
                    </span>
                </div>
                <FaSignOutAlt
                    className="text-gray-600 dark:text-gray-400 hover:text-red-400 cursor-pointer"
                    onClick={handleLogout}
                    title="Logout"
                />
            </div>
        </div>
    )
}
