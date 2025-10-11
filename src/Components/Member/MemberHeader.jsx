import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '../Toast/useToast';
import { FaBuilding, FaSignOutAlt, FaMoon, FaSun, FaBell, FaUserCircle } from 'react-icons/fa';

export default function MemberHeader({ profile }) {
  const { push: pushToast } = useToast();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const initial = saved == null ? true : saved === 'true';
    setIsDarkMode(initial);
    if (initial) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      pushToast({ type: 'success', title: 'Logged out' });
      navigate('/');
    } catch (e) {
      pushToast({ type: 'error', title: 'Logout failed', description: e.message });
    }
  };

  return (
    <div className="flex justify-between items-center px-6 py-2 bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white shadow-md">
      {/* Logo */}
      <div className="flex items-center gap-2 text-lg font-semibold">
        <FaBuilding className="text-blue-600 dark:text-blue-400" />
        <span>FlatMate</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 text-sm">
        <button onClick={toggleDarkMode} title="Toggle Dark Mode">
          {isDarkMode ? (
            <FaSun className="cursor-pointer text-yellow-400 hover:text-white" />
          ) : (
            <FaMoon className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-white" />
          )}
        </button>
        <div className="relative">
          <FaBell className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-white" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
        </div>
        <FaUserCircle className="text-xl text-gray-700 dark:text-gray-300" />
        <div className="flex flex-col text-right">
          <span className="font-medium">{profile?.fullName || 'Member User'}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{profile?.flatNumber ? `Flat ${profile.flatNumber}` : 'Member'}</span>
        </div>
        <FaSignOutAlt
          className="text-gray-600 dark:text-gray-400 hover:text-red-400 cursor-pointer"
          onClick={handleLogout}
          title="Logout"
        />
      </div>
    </div>
  );
}
