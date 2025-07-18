import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { FaSyncAlt } from 'react-icons/fa';

const SystemStatus = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const db = getDatabase();
            const statusRef = ref(db, 'systemStatus');
            const snapshot = await get(statusRef);
            if (snapshot.exists()) {
                setStatus(snapshot.val());
            }
        } catch (err) {
            console.error('Failed to fetch system status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    if (loading || !status) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-800 dark:text-white shadow text-sm">
                <p className="animate-pulse text-center">Loading System Status...</p>
            </div>
        );
    }

    const { databaseStorage, paymentGateway, lastBackup, version } = status;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-800 dark:text-white shadow text-sm">
            <h2 className="text-lg font-semibold mb-4">System Status</h2>

            <div className="mb-2">
                <p className="text-gray-600 dark:text-gray-300">Database Storage</p>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500"
                        style={{ width: `${databaseStorage}%` }}
                    ></div>
                </div>
                <p className="text-right text-xs mt-1 text-gray-700 dark:text-gray-400">
                    {databaseStorage}%
                </p>
            </div>

            <p className="mb-1">
                <span className="text-gray-600 dark:text-gray-300">Payment Gateway:</span>{' '}
                <span className="text-green-600 dark:text-green-400 font-medium">{paymentGateway}</span>
            </p>

            <p className="mb-1">
                <span className="text-gray-600 dark:text-gray-300">Last Backup:</span>{' '}
                {new Date(lastBackup).toLocaleString()}
            </p>

            <p className="mb-4">
                <span className="text-gray-600 dark:text-gray-300">System Version:</span>{' '}
                <span className="font-medium">{version}</span>
            </p>

            <button
                onClick={fetchStatus}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 w-full py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-white"
            >
                <FaSyncAlt /> Check for Updates
            </button>
        </div>
    );
};

export default SystemStatus;
