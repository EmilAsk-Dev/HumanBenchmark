import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Friend } from "@/types/friends";
import { FriendListItem } from "@/hooks/useFriends";

interface FriendsListProps {
  items: FriendListItem[];
  onMessageClick: (friend: Friend) => void;
  onProfileClick: (friend: Friend) => void;
  onRemoveClick?: (friend: Friend) => void;
}

export function FriendsList({ items, onMessageClick, onProfileClick, onRemoveClick }: FriendsListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.user.id}
          className="flex items-center justify-between p-3 rounded-xl bg-background/50"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.user.avatar} />
              <AvatarFallback>{item.user.userName?.[0] ?? "?"}</AvatarFallback>
            </Avatar>

            <div className="leading-tight">
              <p className="font-medium text-foreground">{item.user.userName}</p>
              <p className="text-xs text-muted-foreground">
                Friends since {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => onMessageClick(item.user)}>
              Message
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onProfileClick(item.user)}>
              Profile
            </Button>
            {onRemoveClick && (
              <Button size="sm" variant="destructive" onClick={() => onRemoveClick(item.user)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
