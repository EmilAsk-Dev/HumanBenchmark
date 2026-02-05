import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Friend } from "@/types/friends";

export type FriendRequestItem = {
  id: string;
  user: Friend;
  createdAt: string;
};

interface FriendRequestsProps {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export function FriendRequests({
  incoming,
  outgoing,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestsProps) {
  const [incomingOpen, setIncomingOpen] = useState(true);
  const [outgoingOpen, setOutgoingOpen] = useState(true);

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {incoming.length > 0 && (
        <div>
          <button
            onClick={() => setIncomingOpen(!incomingOpen)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Incoming requests
              </span>
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {incoming.length}
              </span>
            </div>
            {incomingOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {incomingOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden mt-2"
              >
                {incoming.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={req.user.avatar ?? ""} />
                        <AvatarFallback>
                          {req.user.userName?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {req.user.userName ?? "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{req.user.userName ?? "unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onAccept(req.id)}
                        className="h-8 w-8 bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-400"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDecline(req.id)}
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
      )}

      {outgoing.length > 0 && (
        <div>
          <button
            onClick={() => setOutgoingOpen(!outgoingOpen)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-secondary/40 border border-border"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Sent requests
              </span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                {outgoing.length}
              </span>
            </div>
            {outgoingOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {outgoingOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden mt-2"
              >
                {outgoing.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={req.user.avatar ?? ""} />
                        <AvatarFallback>
                          {req.user.userName?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {req.user.userName ?? "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{req.user.userName ?? "unknown"}
                        </p>
                      </div>
                    </div>

                    {onCancel ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onCancel(req.id)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled>
                        Pending
                      </Button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
