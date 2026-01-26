import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const location = useLocation();

    const { data, isLoading } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.getMe();
            if (res.error) throw new Error(res.error);
            return res.data;
        },
        retry: false,
    });

    if (isLoading) return null;

    if (!data) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
