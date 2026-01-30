import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FriendRequest } from "@/types/friends";
import { cn } from "@/lib/utils";

interface FriendRequestsProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function FriendRequests({
  requests,
  onAccept,
  onDecline,
}: FriendRequestsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (requests.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 rounded-xl bg-primary/10 border border-primary/20 mb-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Vänförfrågningar
          </span>
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.from.avatar} />
                    <AvatarFallback>
                      {request.from.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {request.from.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{request.from.username}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onAccept(request.id)}
                    className="h-8 w-8 bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-400"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDecline(request.id)}
                    className="h-8 w-8 bg-destructive/20 text-destructive hover:bg-destructive/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
