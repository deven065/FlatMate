import {
    FaBuilding, FaUsers, FaMoneyBillAlt, FaReceipt, FaBullhorn, FaQuestionCircle,
    FaMoon, FaBell, FaUserCircle, FaSignOutAlt
} from 'react-icons/fa';

export default function Header() {
    return (
    <div className="bg-[#1f2937] text-white">
      {/* Top Navigation Bar */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-700">
        {/* Left - Logo and Title */}
        <div className="flex items-center gap-2">
            <FaBuilding className="text-blue-500 text-xl" />
            <h1 className="text-lg font-semibold">Society Maintenance</h1>
        </div>

        {/* Right - Icons and User Info */}
        <div className="flex items-center gap-4 text-sm">
            <FaMoon className="hover:text-gray-300 cursor-pointer" />
            <div className="relative">
            <FaBell className="hover:text-gray-300 cursor-pointer text-lg" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <FaUserCircle className="text-2xl text-gray-300" />
            <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-gray-400">Administrator</span>
            </div>
            <FaSignOutAlt className="hover:text-gray-300 cursor-pointer" />
        </div>
        </div>

      {/* Bottom Tabs */}
        <div className="flex gap-6 px-6 py-2 bg-[#111827] text-sm">
        <Tab icon={<FaUsers />} label="Dashboard" active />
        <Tab icon={<FaUsers />} label="Members" />
        <Tab icon={<FaMoneyBillAlt />} label="Payments" />
        <Tab icon={<FaReceipt />} label="Receipts" />
        <Tab icon={<FaBullhorn />} label="Notices" />
        <Tab icon={<FaQuestionCircle />} label="Queries" />
        </div>
    </div>
    );
}

function Tab({ icon, label, active }) {
    return (
    <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer ${
        active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
    >
        {icon}
        <span>{label}</span>
    </div>
    );
}