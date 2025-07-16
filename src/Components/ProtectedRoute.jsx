import { Navigate } from "react-router-dom";

function ProtectedRoute({ isLoggedIn, isAdmin, requireAdmin, children }) {
    if (!isLoggedIn) {
        return <Navigate to="/LoginPage" replace />;
    }
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export default ProtectedRoute;