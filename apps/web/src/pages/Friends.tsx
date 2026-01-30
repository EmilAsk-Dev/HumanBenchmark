import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { FriendsList } from "@/components/friends/FriendsList";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { MessageSheet } from "@/components/friends/MessageSheet";
import { Friend, FriendRequest, Conversation, Message } from "@/types/friends";

export default function Friends() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  const handleAcceptRequest = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      setFriends((prev) => [...prev, request.from]);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleMessageClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsMessageOpen(true);
  };

  const handleAddFriend = (friend: Friend) => {
    if (!friends.find((f) => f.id === friend.id)) {
      setFriends((prev) => [...prev, friend]);
    }
  };

  const selectedConversation = selectedFriend
    ? conversations.find((c) => c.friend.id === selectedFriend.id)
    : undefined;

  const onlineFriends = friends.filter(
    (f) => f.status === "online" || f.status === "playing",
  );
  const offlineFriends = friends.filter((f) => f.status === "offline");

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between mb-2">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-foreground"
          >
            Vänner
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className={showSearch ? "text-primary" : "text-muted-foreground"}
            >
              <Search className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-6"
        >
          {friends.length} vänner • {onlineFriends.length} online
        </motion.p>

        <AnimatePresence>
          {showSearch && (
            <FriendSearch
              onClose={() => setShowSearch(false)}
              onAddFriend={handleAddFriend}
            />
          )}
        </AnimatePresence>

        <FriendRequests
          requests={requests}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
        />

        {onlineFriends.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Online — {onlineFriends.length}
              </span>
            </div>
            <FriendsList
              friends={onlineFriends}
              onMessageClick={handleMessageClick}
              onProfileClick={(friend) => navigate(`/profile/${friend.id}`)}
            />
          </div>
        )}

        {offlineFriends.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Offline — {offlineFriends.length}
              </span>
            </div>
            <FriendsList
              friends={offlineFriends}
              onMessageClick={handleMessageClick}
              onProfileClick={(friend) => navigate(`/profile/${friend.id}`)}
            />
          </div>
        )}

        {friends.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Inga vänner ännu
            </h3>
            <p className="text-muted-foreground mb-4">
              Sök efter användare för att lägga till vänner
            </p>
            <Button onClick={() => setShowSearch(true)}>
              <Search className="h-4 w-4 mr-2" />
              Sök användare
            </Button>
          </motion.div>
        )}

        <MessageSheet
          friend={selectedFriend}
          conversation={selectedConversation}
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
