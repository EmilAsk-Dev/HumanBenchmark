import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/AuthProvider";

export default function PublicOnlyRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    if (isAuthenticated) return <Navigate to="/" replace />;

    return children;
}
