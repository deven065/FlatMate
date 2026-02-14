import { useEffect, useState, useRef } from "react";
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
    FaBell,
    FaUserCircle,
    FaSignOutAlt
} from "react-icons/fa";

export default function Header() {
    const [userData, setUserData] = useState({ fullName: "", role: "" });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "New Payment Received", message: "Deven Rikame paid ₹3,400", time: "2 hours ago", read: false },
        { id: 2, title: "New Member Added", message: "Sakshi Soni joined the society", time: "5 hours ago", read: false },
        { id: 3, title: "Maintenance Due", message: "Payment deadline is approaching", time: "1 day ago", read: false }
    ]);
    const notificationRef = useRef(null);
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

    const markAsRead = (notificationId) => {
        setNotifications(prevNotifications =>
            prevNotifications.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    };

    const clearAllNotifications = () => {
        setNotifications(prevNotifications =>
            prevNotifications.map(notif => ({ ...notif, read: true }))
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotifications]);

    const navItems = [];

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
            <div className="flex items-center gap-4 text-sm relative">
                {/* Notification Bell with Popup */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)} 
                        className="relative"
                        title="Notifications"
                    >
                        <FaBell className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1f2937] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                        <p className="text-sm">No notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-3 hover:bg-gray-100 dark:hover:bg-[#374151] cursor-pointer border-b border-gray-100 dark:border-gray-700 transition ${
                                                notif.read ? 'opacity-60' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>}
                                                {notif.read && <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-1.5"></div>}
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                                    <button 
                                        onClick={clearAllNotifications}
                                        className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-1"
                                    >
                                        Mark All as Read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
