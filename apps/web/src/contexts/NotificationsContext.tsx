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

export interface Notification {
  id: string;
  type: "message" | "friend_request";
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

// WebSocket configuration
const WS_CONFIG = {
  // Convert HTTP URL to WebSocket URL
  getUrl: () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws/notifications`;
  },
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage whenever notifications change
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

      // Show toast popup
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

  // WebSocket connection logic
  const connectWebSocket = useCallback(() => {
    const token = getAuthToken();

    // Don't connect if no auth token
    if (!token) {
      console.log("[WebSocket] No auth token, skipping connection");
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${WS_CONFIG.getUrl()}?token=${encodeURIComponent(token)}`;
      console.log("[WebSocket] Connecting to:", WS_CONFIG.getUrl());

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocket] Received:", data);

          // Handle different notification types from backend
          if (data.type === "message" || data.type === "friend_request") {
            addNotification({
              type: data.type,
              title:
                data.title ||
                (data.type === "message" ? "Nytt meddelande" : "Vänförfrågan"),
              message: data.message || data.content || "",
              time: data.time || new Date().toLocaleString("sv-SE"),
              fromUserId: data.fromUserId || data.senderId,
            });
          }
        } catch (err) {
          console.error("[WebSocket] Failed to parse message:", err);
        }
      };

      ws.onclose = (event) => {
        console.log("[WebSocket] Disconnected:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection if not a clean close
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < WS_CONFIG.MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          const delay =
            WS_CONFIG.RECONNECT_DELAY * reconnectAttemptsRef.current;
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };
    } catch (err) {
      console.error("[WebSocket] Failed to connect:", err);
    }
  }, [addNotification]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connectWebSocket();

    // Listen for auth changes (login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        if (e.newValue) {
          connectWebSocket();
        } else {
          disconnectWebSocket();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Reconnect when auth token changes within same tab
  useEffect(() => {
    const token = getAuthToken();
    if (token && !isConnected) {
      connectWebSocket();
    } else if (!token && isConnected) {
      disconnectWebSocket();
    }
  }, [connectWebSocket, disconnectWebSocket, isConnected]);

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
