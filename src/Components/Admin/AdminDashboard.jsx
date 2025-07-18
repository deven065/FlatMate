import { useEffect, useState } from 'react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaMoneyBill, FaChartPie, FaSignOutAlt, FaTools } from 'react-icons/fa';
import MemberTable from './MemberTable';
import RecentPayments from './RecentPayments';
import MaintenanceConfigForm from './MaintenanceConfigForm';
import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import Header from './Header';

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
        <div>
            <div className='p-6 bg-[#111827] text-white min-h-screen'>
                <Header />
                <div className='flex flex-wrap gap-4 mb-6'>
                    <DashboardStats />
                </div>

                {/* Main Section */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='col-span-2 space-y-4'>
                        <MemberTable />
                        <RecentPayments />
                    </div>
                    <div className='space-y-4'>
                        <MaintenanceConfigForm />
                        <QuickActions />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;
