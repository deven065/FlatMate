import { getAuth } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
    const [isAuthorized, setIsAuthorized] = useState(null); // null = loading
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuthorization = async () => {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                setIsAuthorized(false);
                setChecking(false);
                return;
            }

            const roleRef = ref(db, `users/${user.uid}/role`);
            const snapshot = await get(roleRef);
            if (snapshot.exists()) {
                const userRole =  snapshot.val();
                setIsAuthorized(userRole === requiredRole);
            } else {
                setIsAuthorized(false);
            }
            setChecking(false);
        };
        checkAuthorization();
    }, [requiredRole]);

    if (checking) return <div className = "text-center py-8 text-gray-500">Loading...</div>

    return isAuthorized ? children : <Navigate to = "/" replace />
};

export default ProtectedRoute;