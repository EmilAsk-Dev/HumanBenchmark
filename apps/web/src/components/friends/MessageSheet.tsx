import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Friend, Message } from "@/types/friends";
import { cn } from "@/lib/utils";

interface MessageSheetProps {
  friend: Friend | null;
  isOpen: boolean;
  onClose: () => void;
  getMessages: (friendId: string) => Promise<Message[]>;
  sendMessage: (friendId: string, content: string) => Promise<{ success: boolean; error: any; message?: any }>;
}

export function MessageSheet({
  friend,
  isOpen,
  onClose,
  getMessages,
  sendMessage,
}: MessageSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !friend) return;

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const data = await getMessages(friend.id);
        if (!cancelled) setMessages(data || []);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, friend?.id, getMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!friend) return;

    const content = newMessage.trim();
    if (!content || isSending) return;

    setIsSending(true);

    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      senderId: "me",
      receiverId: friend.id,
      content,
      createdAt: new Date(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    const res = await sendMessage(friend.id, content);

    if (!res?.success) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(content);
      setIsSending(false);
      return;
    }

    const serverMsg = res.message;

    if (serverMsg) {
      const mapped: Message = {
        id: String(serverMsg.id ?? tempId),
        senderId: serverMsg.senderId ?? "me",
        receiverId: friend.id,
        content: serverMsg.content ?? content,
        createdAt: new Date(serverMsg.sentAt ?? serverMsg.createdAt ?? new Date()),
        isRead: false,
      };

      setMessages((prev) => prev.map((m) => (m.id === tempId ? mapped : m)));
    }

    setIsSending(false);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!friend) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatar ?? ""} />
              <AvatarFallback>{friend.userName?.[0] ?? "?"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-left">
              <SheetTitle className="text-base">{friend.userName}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {friend.status === "online"
                  ? "Online"
                  : friend.status === "playing"
                    ? `Playing ${friend.currentGame ?? ""}`
                    : "Offline"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(85vh-140px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.senderId !== friend.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2 rounded-2xl",
                      isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md",
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
              disabled={isSending}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || isSending} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
