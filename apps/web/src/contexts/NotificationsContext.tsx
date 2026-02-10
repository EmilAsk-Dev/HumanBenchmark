import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { toast } from "sonner";
import { MessageCircle, UserPlus } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "@/hooks/AuthProvider";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  fromUserId?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  isConnected: boolean;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const SIGNALR_CONFIG = {
  // Use relative URL so Vite proxy (dev) / same-origin (prod) works with cookie auth.
  url: "/hubs/notifications",
  MAX_RECONNECT_ATTEMPTS: 6,
};

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [isConnected, setIsConnected] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const stableTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const disconnectingRef = useRef(false);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      const icon =
        notification.type === "message" ? (
          <MessageCircle className="h-4 w-4 text-primary" />
        ) : (
          <UserPlus className="h-4 w-4 text-green-500" />
        );

      toast(notification.title, {
        description: notification.message,
        icon,
        position: "top-right",
        duration: 5000,
      });
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearStableTimer = useCallback(() => {
    if (stableTimerRef.current) {
      window.clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(
    async (reason?: unknown) => {
      if (!isAuthenticatedRef.current) return;
      if (disconnectingRef.current) return;
      clearReconnectTimer();

      const attempt = reconnectAttemptsRef.current;
      if (attempt >= SIGNALR_CONFIG.MAX_RECONNECT_ATTEMPTS) return;

      // Exponential-ish backoff: 1s, 2s, 4s, 8s, 15s, 30s
      const delayMs = Math.min(30000, Math.round(1000 * Math.pow(2, attempt)));
      reconnectAttemptsRef.current = attempt + 1;

      reconnectTimerRef.current = window.setTimeout(() => {
        if (!isAuthenticatedRef.current) return;
        if (disconnectingRef.current) return;

        connectSignalR().catch(() => {
          // If this fails again, scheduleReconnect will be called from connectSignalR
        });
      }, delayMs);

      // Keep a breadcrumb for debugging (won't crash in prod)
      // eslint-disable-next-line no-console
      console.warn("[SignalR] Notifications reconnect scheduled", { attempt: attempt + 1, delayMs, reason });
    },
    // connectSignalR is defined below but stable via useCallback; TS/ESLint ok with this closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearReconnectTimer],
  );

  const connectSignalR = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    if (disconnectingRef.current) return;

    try {
      const existing = connectionRef.current;
      const state = existing?.state;

      // Already connected or in-flight: do nothing
      if (
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        return;
      }

      const connection =
        existing ??
        new signalR.HubConnectionBuilder()
          .withUrl(SIGNALR_CONFIG.url, {
            // Ensure cookies are sent if you ever run this cross-origin.
            withCredentials: true,
          })
          .build();

      if (!existing) {
        connectionRef.current = connection;

        connection.onclose((error) => {
          setIsConnected(false);
          clearStableTimer();
          if (disconnectingRef.current) return;
          scheduleReconnect(error).catch(() => { });
        });

        connection.on("ReceiveMessage", (data: any) => {
          addNotification({
            type: "message",
            title: data.senderName || "Nytt meddelande",
            message: data.content || data.message || "",
            time: data.sentAt || new Date().toLocaleString("sv-SE"),
            fromUserId: data.senderId?.toString(),
          });
        });

        connection.on("ReceiveFriendRequest", (data: any) => {
          addNotification({
            type: "friend_request",
            title: "Ny vänförfrågan",
            message: data.fromUsername || data.message || "Någon vill bli din vän",
            time: data.time || new Date().toLocaleString("sv-SE"),
            fromUserId: data.fromUserId?.toString(),
          });
        });

        connection.on("ReceiveNotification", (data: any) => {
          addNotification({
            type: data.type || "message",
            title: data.title || "Notis",
            message: data.message || data.content || "",
            time: data.time || new Date().toLocaleString("sv-SE"),
            fromUserId: data.fromUserId?.toString(),
          });
        });
      }

      clearReconnectTimer();
      await connection.start();
      setIsConnected(true);

      // Only reset reconnect attempts after the connection has been stable for a bit.
      // This prevents infinite fast reconnect loops if the server keeps closing the connection.
      clearStableTimer();
      stableTimerRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current = 0;
      }, 30_000);
    } catch (err) {
      setIsConnected(false);
      await scheduleReconnect(err);
    }
  }, [addNotification, clearReconnectTimer, clearStableTimer, scheduleReconnect]);

  const disconnectSignalR = useCallback(async () => {
    disconnectingRef.current = true;
    clearReconnectTimer();
    clearStableTimer();
    reconnectAttemptsRef.current = 0;
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log("[SignalR] Disconnected");
      } catch (err) {
        console.error("[SignalR] Error disconnecting:", err);
      }
      connectionRef.current = null;
    }
    setIsConnected(false);
    disconnectingRef.current = false;
  }, [clearReconnectTimer, clearStableTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSignalR();
      return;
    }

    connectSignalR();

    return () => {
      disconnectSignalR();
    };
  }, [connectSignalR, disconnectSignalR, isAuthenticated]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAllRead,
        markAsRead,
        clearNotification,
        clearAll,
        isConnected,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
