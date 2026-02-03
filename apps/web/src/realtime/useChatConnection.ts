import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/hooks/AuthProvider";

export function useChatConnection() {
    const { isAuthenticated } = useAuth();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            connection?.stop().catch(() => { });
            setConnection(null);
            setReady(false);
            return;
        }

        const conn = new signalR.HubConnectionBuilder()
            .withUrl("/hubs/chat") // Vite proxy forwards /hubs -> API (ws: true)
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

        conn.onreconnecting(() => setReady(false));
        conn.onreconnected(() => setReady(true));
        conn.onclose(() => setReady(false));

        setConnection(conn);

        (async () => {
            try {
                await conn.start();
                setReady(true);
            } catch (e) {
                console.error("SignalR start failed", e);
                setReady(false);
            }
        })();

        return () => {
            conn.stop().catch(() => { });
            setReady(false);
            setConnection(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    return { connection, ready };
}
