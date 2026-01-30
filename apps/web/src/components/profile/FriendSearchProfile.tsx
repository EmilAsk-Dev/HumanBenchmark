import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockFriends } from "@/lib/mockFriends";
import { Friend } from "@/types/friends";

interface FriendSearchProfileProps {
  onClose?: () => void;
}

export function FriendSearchProfile({ onClose }: FriendSearchProfileProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const navigate = useNavigate();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      const filtered = mockFriends.filter(
        (friend) =>
          friend.id.toLowerCase().includes(value.toLowerCase()) ||
          friend.username.toLowerCase().includes(value.toLowerCase()) ||
          friend.displayName.toLowerCase().includes(value.toLowerCase()),
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const handleSelectFriend = (friend: Friend) => {
    navigate(`/profile/${friend.id}`);
    onClose?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 overflow-hidden"
    >
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök vän via ID eller namn..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground mb-2">
                {results.length} vänner hittade
              </p>
              {results.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectFriend(friend)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                >
                  <img
                    src={friend.avatar}
                    alt={friend.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{friend.username} • ID: {friend.id}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      friend.status === "online"
                        ? "bg-green-500"
                        : friend.status === "playing"
                          ? "bg-primary"
                          : "bg-muted-foreground"
                    }`}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
          {query && results.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground text-center py-4"
            >
              Ingen vän hittades. Du kan bara söka bland dina vänner.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
