import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Friend } from "@/types/friends";
import { mockSearchResults } from "@/lib/mockFriends";
import { cn } from "@/lib/utils";

interface FriendSearchProps {
  onClose: () => void;
}

export function FriendSearch({ onClose }: FriendSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      // Simulate search - in real app this would be an API call
      const filtered = mockSearchResults.filter(
        (f) =>
          f.username.toLowerCase().includes(value.toLowerCase()) ||
          f.displayName.toLowerCase().includes(value.toLowerCase()),
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const sendFriendRequest = (friendId: string) => {
    setSentRequests((prev) => new Set([...prev, friendId]));
    // In real app, this would be an API call
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-2xl p-4 mb-4 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Sök användare..."
            className="pl-10"
            autoFocus
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {results.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={sentRequests.has(user.id) ? "secondary" : "default"}
                  onClick={() => sendFriendRequest(user.id)}
                  disabled={sentRequests.has(user.id)}
                  className={cn(
                    sentRequests.has(user.id) &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {sentRequests.has(user.id) ? (
                    "Skickad"
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Lägg till
                    </>
                  )}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {query.length > 0 && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground py-4"
          >
            Inga användare hittades
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
