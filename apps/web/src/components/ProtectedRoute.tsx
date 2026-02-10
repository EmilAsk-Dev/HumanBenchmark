import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/AuthProvider";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const location = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
