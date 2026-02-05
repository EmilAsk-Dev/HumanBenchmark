import { Link } from "react-router-dom";
import { Bell, Moon, Sun, X, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/contexts/NotificationsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, clearNotification } =
    useNotifications();

  const getIcon = (type: "message" | "friend_request") => {
    return type === "message" ? (
      <MessageCircle className="h-4 w-4 text-primary" />
    ) : (
      <UserPlus className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <span className="text-lg font-bold text-primary-foreground">H</span>
          </div>
          <span className="text-xl font-bold text-gradient-primary">
            Human Bench
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b border-border p-3">
                <h3 className="font-semibold text-foreground">Notiser</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={markAllRead}
                  >
                    Markera alla lästa
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Inga notiser
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-3 border-b border-border last:border-0 transition-colors ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => clearNotification(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
