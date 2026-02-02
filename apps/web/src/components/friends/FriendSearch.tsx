import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Friend } from "@/types/friends";
import { cn } from "@/lib/utils";

interface FriendSearchProps {
  searchUsers: (query: string) => Promise<Friend[]>;
  onAddFriend?: (userId: string) => Promise<{ success: boolean; error: any }>;
}

export function FriendSearch({ searchUsers, onAddFriend }: FriendSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const requestId = useRef(0);

  const handleSearch = async (value: string) => {
    setQuery(value);

    const q = value.trim();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const myId = ++requestId.current;
    setIsSearching(true);

    try {
      const users = await searchUsers(q);
      if (myId === requestId.current) setResults(users);
    } catch {
      if (myId === requestId.current) setResults([]);
    } finally {
      if (myId === requestId.current) setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friend: Friend) => {
    setSentRequests((prev) => new Set(prev).add(friend.id));
    if (!onAddFriend) return;

    const res = await onAddFriend(friend.id);
    if (!res?.success) {
      setSentRequests((prev) => {
        const next = new Set(prev);
        next.delete(friend.id);
        return next;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 mb-4 border border-border"
    >
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-10"
          autoFocus
        />
      </div>

      <AnimatePresence>
        {isSearching && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground py-4"
          >
            Searching...
          </motion.p>
        )}

        {!isSearching && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-xl bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.userName?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      @{user.userName}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={sentRequests.has(user.id) ? "secondary" : "default"}
                  onClick={() => sendFriendRequest(user)}
                  disabled={sentRequests.has(user.id)}
                  className={cn(
                    sentRequests.has(user.id) && "bg-muted text-muted-foreground"
                  )}
                >
                  {sentRequests.has(user.id) ? (
                    "Sent"
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </motion.div>
        )}

        {!isSearching && query.length > 0 && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground py-4"
          >
            No results
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
