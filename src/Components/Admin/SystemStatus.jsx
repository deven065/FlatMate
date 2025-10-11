import React, { useCallback, useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { FaSyncAlt } from 'react-icons/fa';
import { motion as Motion } from 'framer-motion';
import { useToast } from '../Toast/useToast';

const SystemStatus = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const { push } = useToast();
    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
        const db = getDatabase();
        const statusRef = ref(db, 'systemStatus');
        const snapshot = await get(statusRef);
        if (snapshot.exists()) {
            setStatus(snapshot.val());
            push({ type: 'success', title: 'Status updated' });
        } else {
            console.warn("systemStatus node does not exist.");
            setStatus(null);
            push({ type: 'warning', title: 'No status found' });
        }
        } catch (err) {
        console.error("Failed to fetch system status:", err);
        setStatus(null);
        push({ type: 'error', title: 'Update failed', description: err.message });
        } finally {
        setLoading(false);
        }
    }, [push]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    if (loading) {
        return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-800 dark:text-white shadow text-sm">
            <p className="animate-pulse text-center">Loading System Status...</p>
        </div>
        );
    }

    if (!status) {
        return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl text-gray-800 dark:text-white shadow text-sm">
            <p className="text-red-500 text-center">⚠️ System status not found.</p>
            <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchStatus}
            className="mt-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 w-full py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
            <FaSyncAlt /> Retry
            </Motion.button>
        </div>
        );
    }

    const { databaseStorage = 0, paymentGateway = "Unknown", lastBackup, version = "N/A" } = status;

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
            {lastBackup ? new Date(lastBackup).toLocaleString() : "N/A"}
        </p>

        <p className="mb-4">
            <span className="text-gray-600 dark:text-gray-300">System Version:</span>{' '}
            <span className="font-medium">{version}</span>
        </p>

        <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchStatus}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 w-full py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
            <FaSyncAlt /> Check for Updates
        </Motion.button>
        </div>
    );
};

export default SystemStatus;
