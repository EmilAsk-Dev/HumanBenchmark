import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
import { useAuth } from "@/hooks/AuthProvider";

export default function NotificationsConnector() {
    const { isAuthenticated } = useAuth();
    const connRef = useRef<signalR.HubConnection | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            connRef.current?.stop();
            connRef.current = null;
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/hubs/notifications") // cookie auth
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .build();

        connRef.current = connection;

        connection.on("Notification", (payload: { title?: string; message?: string }) => {
            toast(payload.title ?? "Notification", { description: payload.message ?? "" });
        });

        (async () => {
            try {
                await connection.start();
            } catch (err) {
                console.error("SignalR connect failed", err);
            }
        })();

        return () => {
            connection.stop();
        };
    }, [isAuthenticated]);

    return null;
}
