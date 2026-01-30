import { motion } from "framer-motion";
import { MessageCircle, Gamepad2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Friend } from "@/types/friends";
import { cn } from "@/lib/utils";

interface FriendsListProps {
  friends: Friend[];
  onMessageClick: (friend: Friend) => void;
  onProfileClick?: (friend: Friend) => void;
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-muted-foreground",
  playing: "bg-primary",
};

const statusText = {
  online: "Online",
  offline: "Offline",
  playing: "Spelar",
};

export function FriendsList({
  friends,
  onMessageClick,
  onProfileClick,
}: FriendsListProps) {
  const formatLastSeen = (date?: Date) => {
    if (!date) return "";
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Nyligen";
    if (hours < 24) return `${hours}h sedan`;
    return `${Math.floor(hours / 24)}d sedan`;
  };

  return (
    <div className="space-y-2">
      {friends.map((friend, index) => (
        <motion.div
          key={friend.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onProfileClick?.(friend)}
          className={cn(
            "flex items-center justify-between p-3 rounded-xl bg-card border border-border",
            onProfileClick &&
              "cursor-pointer hover:border-primary/50 transition-colors",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={friend.avatar} />
                <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                  statusColors[friend.status],
                )}
              />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {friend.displayName}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {friend.status === "playing" ? (
                  <>
                    <Gamepad2 className="h-3 w-3 text-primary" />
                    <span className="text-primary">{friend.currentGame}</span>
                  </>
                ) : friend.status === "offline" ? (
                  <span>{formatLastSeen(friend.lastSeen)}</span>
                ) : (
                  <span>{statusText[friend.status]}</span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onMessageClick(friend);
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
