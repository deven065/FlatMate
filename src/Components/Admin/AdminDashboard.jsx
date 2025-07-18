import { useEffect, useState } from 'react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaMoneyBill, FaChartPie, FaSignOutAlt, FaTools } from 'react-icons/fa';
import MemberTable from './MemberTable';
import RecentPayments from './RecentPayments';
import MaintenanceConfigForm from './MaintenanceConfigForm';

const AdminDashboard = () => {
    const [adminName, setAdminName] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const auth = getAuth();
    const db = getDatabase();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    if (userData.role === 'admin') {
                        setAdminName(userData.fullName);
                        setLoading(false);
                    } else {
                        alert('Access denied. Only admins can access this dashboard.');
                        navigate('/');
                    }
                } else {
                    alert('User data not found.');
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
                <h1 className="text-xl font-semibold animate-pulse">Loading Admin Dashboard...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-800 dark:text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Welcome, {adminName} 👋</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow-md transition"
                >
                    <FaSignOutAlt /> Logout
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder Cards */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 hover:shadow-lg transition">
                    <FaUsers className="text-3xl text-blue-500" />
                    <div>
                        <h2 className="text-lg font-semibold">Manage Members</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add, remove or update member details</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 hover:shadow-lg transition">
                    <FaMoneyBill className="text-3xl text-green-500" />
                    <div>
                        <h2 className="text-lg font-semibold">Maintenance Fees</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage monthly fees</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 hover:shadow-lg transition">
                    <FaChartPie className="text-3xl text-purple-500" />
                    <div>
                        <h2 className="text-lg font-semibold">Reports</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View income/expense statistics</p>
                    </div>
                </div>
            </div>

            <br />

            <MemberTable />
            <br />
            <RecentPayments />

            <br />
            <MaintenanceConfigForm />

            <div className="mt-10 text-center">
                <p className="text-sm text-gray-400">Powered by Deven Rikame 🚀</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
