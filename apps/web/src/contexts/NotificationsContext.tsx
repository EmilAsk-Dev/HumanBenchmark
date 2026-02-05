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
import { getAuthToken } from "@/lib/api";
import * as signalR from "@microsoft/signalr";

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
  getUrl: () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/hubs/notifications`;
  },
  RECONNECT_DELAYS: [0, 2000, 5000, 10000, 30000],
};

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [isConnected, setIsConnected] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

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

  const connectSignalR = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      console.log("[SignalR] No auth token, skipping connection");
      return;
    }

    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      const hubUrl = SIGNALR_CONFIG.getUrl();
      console.log("[SignalR] Connecting to:", hubUrl);

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect(SIGNALR_CONFIG.RECONNECT_DELAYS)
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connection.onreconnecting((error) => {
        console.log("[SignalR] Reconnecting...", error);
        setIsConnected(false);
      });

      connection.onreconnected((connectionId) => {
        console.log("[SignalR] Reconnected:", connectionId);
        setIsConnected(true);
      });

      connection.onclose((error) => {
        console.log("[SignalR] Connection closed:", error);
        setIsConnected(false);
        connectionRef.current = null;
      });

      connection.on("ReceiveMessage", (data: any) => {
        console.log("[SignalR] ReceiveMessage:", data);
        addNotification({
          type: "message",
          title: data.senderName || "Nytt meddelande",
          message: data.content || data.message || "",
          time: data.sentAt || new Date().toLocaleString("sv-SE"),
          fromUserId: data.senderId?.toString(),
        });
      });

      connection.on("ReceiveFriendRequest", (data: any) => {
        console.log("[SignalR] ReceiveFriendRequest:", data);
        addNotification({
          type: "friend_request",
          title: "Ny vänförfrågan",
          message:
            data.fromUsername || data.message || "Någon vill bli din vän",
          time: data.time || new Date().toLocaleString("sv-SE"),
          fromUserId: data.fromUserId?.toString(),
        });
      });

      connection.on("ReceiveNotification", (data: any) => {
        console.log("[SignalR] ReceiveNotification:", data);
        addNotification({
          type: data.type || "message",
          title: data.title || "Notis",
          message: data.message || data.content || "",
          time: data.time || new Date().toLocaleString("sv-SE"),
          fromUserId: data.fromUserId?.toString(),
        });
      });

      await connection.start();
      console.log("[SignalR] Connected");
      connectionRef.current = connection;
      setIsConnected(true);
    } catch (err) {
      console.error("[SignalR] Failed to connect:", err);
      setIsConnected(false);
    }
  }, [addNotification]);

  const disconnectSignalR = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    connectSignalR();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        if (e.newValue) {
          connectSignalR();
        } else {
          disconnectSignalR();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      disconnectSignalR();
    };
  }, [connectSignalR, disconnectSignalR]);

  useEffect(() => {
    const token = getAuthToken();
    if (token && !isConnected) {
      connectSignalR();
    } else if (!token && isConnected) {
      disconnectSignalR();
    }
  }, [connectSignalR, disconnectSignalR, isConnected]);

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
