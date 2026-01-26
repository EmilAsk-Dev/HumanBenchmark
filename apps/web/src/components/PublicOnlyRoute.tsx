import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function PublicOnlyRoute({ children }: { children: JSX.Element }) {
    const { data, isLoading } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.getMe();
            if (res.error) return null;
            return res.data;
        },
        retry: false,
    });

    if (isLoading) return null;


    if (data) return <Navigate to="/" replace />;

    return children;
}
