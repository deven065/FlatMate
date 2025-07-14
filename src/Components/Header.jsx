import { Moon, Bell, LogOut, User } from 'lucide-react';

export default function Header() {
    return (
        <header className = "flex items-center justify-between px-6 py-3 bg-[#1e2735] text-white shadow-sm">
            {/* Logo + App Name */}
            <div className = "flex items-center space-x-2">
                <h1 classsName = "text-lg font-semibold">FlatMate</h1>
            </div>

            {/* Right Section */}
            <div className = "flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <button className = "w-8 h-8 rounded-full border-blue-400 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition">
                    <Moon size = {16} />
                </button>

                {/* Notification Bell */}
                <div className = "relative">
                    <Bell className = "text-gray-400 size = {20}"/>
                    <span className = "absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                </div>

                {/* User Info */}
                <div className = "flex items-center space-x-2">
                    <div className = "bg-gray-600 p-1.5 rounded-full">
                        <User className = " text-gray-300 size = {16}" />
                    </div>
                    <div className = "text-sm">
                        <div className = "font-semibold">Admin User</div>
                        <div className = "text-gray-400 text-xs">Administrator</div>
                    </div>
                </div>

                {/* Logout Icon */}
                <logOut className = "text-gray-400 hover:text-red-500 cursor-pointer" size={18} />
            </div>
        </header>
    )
}