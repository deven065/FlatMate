import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

import MemberTable from './MemberTable';
import RecentPayments from './RecentPayments';
import MaintenanceConfigForm from './MaintenanceConfigForm';
import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import NoticesManager from './NoticesManager';
import Header from './Header';
import SystemStatus from './SystemStatus';
import Footer from './Footer';

const AdminDashboard = () => {
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
    }, [auth, db, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
                <h1 className="text-xl font-semibold animate-pulse">Loading Admin Dashboard...</h1>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-white text-gray-900 dark:bg-[#111827] dark:text-white">
            {/* Fixed Header */}
            <header className="fixed top-0 w-full z-50 bg-white dark:bg-[#111827] shadow-md">
                <Header />
            </header>

            {/* Scrollable Main Content */}
            <main className="flex-1 overflow-y-auto mt-[70px] mb-[60px] px-6 py-4">
                <div className="max-w-screen-xl mx-auto">
                    <div className='flex flex-wrap gap-4 mb-6 justify-center'>
                        <DashboardStats />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='col-span-2 space-y-6'>
                            <MemberTable />
                            <RecentPayments />
                        </div>
                        <div className='space-y-4'>
                            <MaintenanceConfigForm />
                            <QuickActions />
                            <NoticesManager />
                            <SystemStatus />
                        </div>
                    </div>
                </div>
            </main>

            {/* Fixed Footer */}
            <footer className="fixed bottom-0 w-full z-50 bg-white dark:bg-[#111827]">
                <Footer />
            </footer>
        </div>
    );
};

export default AdminDashboard;
