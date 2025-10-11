import {
    FaFileInvoice,
    FaReceipt,
    FaBell,
    FaFileUpload,
    FaExclamationTriangle,
} from "react-icons/fa";
import { motion as Motion } from "framer-motion";
import { useToast } from "../Toast/useToast";

const quickActions = [
    {
        label: "Generate Bills",
        icon: <FaFileInvoice />,
        color: "bg-blue-700 hover:bg-blue-800",
    },
    {
        label: "Create Receipt",
        icon: <FaReceipt />,
        color: "bg-green-700 hover:bg-green-800",
    },
    {
        label: "Send Reminders",
        icon: <FaBell />,
        color: "bg-purple-700 hover:bg-purple-800",
    },
    {
        label: "Upload Notice",
        icon: <FaFileUpload />,
        color: "bg-amber-700 hover:bg-amber-800",
    },
    {
        label: "View Queries",
        icon: <FaExclamationTriangle />,
        color: "bg-red-700 hover:bg-red-800",
    },
];

export default function QuickActions() {
    const { push } = useToast();
    const onClick = (label) => {
        push({ type: "info", title: label, description: "Action triggered." });
    };
    return (
        <div className="bg-white dark:bg-[#101828] p-4 rounded-lg shadow-md w-full max-w-xs">
            <h2 className="text-gray-800 dark:text-white font-semibold text-lg mb-4">Quick Actions</h2>
            <div className="space-y-3">
                {quickActions.map((action, index) => (
                    <Motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full text-white font-medium flex items-center justify-between px-4 py-2 rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 ${action.color}`}
                        onClick={() => onClick(action.label)}
                    >
                        <span className="flex items-center gap-2">{action.icon} {action.label}</span>
                        <span className="text-lg">›</span>
                    </Motion.button>
                ))}
            </div>
        </div>
    );
}
