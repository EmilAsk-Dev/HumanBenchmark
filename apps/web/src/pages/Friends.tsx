import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { FriendsList } from "@/components/friends/FriendsList";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { MessageSheet } from "@/components/friends/MessageSheet";

import { Friend } from "@/types/friends";
import { useFriends } from "@/hooks/useFriends";

export default function Friends() {
  const navigate = useNavigate();

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);


  const {
    friends,
    friendItems,
    onlineItems,
    offlineItems,
    incomingRequests,
    outgoingRequests,
    conversations,
    isLoading,
    error,
    acceptRequest,
    declineRequest,
    sendFriendRequest,
    searchUsers,
    getMessages,
    sendMessage,
  } = useFriends();

  const handleMessageClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsMessageOpen(true);
  };

  const selectedConversation = selectedFriend
    ? conversations.find((c) => c.friend.id === selectedFriend.id)
    : undefined;

  const conversationId = selectedConversation?.conversationId ?? null;

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Friends
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="text-muted-foreground mb-6"
        >
          {friends.length} friends • {onlineItems.length} online
        </motion.p>

        <FriendSearch searchUsers={searchUsers} onAddFriend={(userId) => sendFriendRequest(userId)} />

        {isLoading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
        {error && <p className="text-sm text-destructive mb-4">Error: {error}</p>}

        <FriendRequests
          incoming={incomingRequests}
          outgoing={outgoingRequests}
          onAccept={(requestId) => acceptRequest(requestId)}
          onDecline={(requestId) => declineRequest(requestId)}
        />

        <div className="bg-card rounded-2xl p-4 border border-border mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">My friends</p>
            <p className="text-xs text-muted-foreground">{friendItems.length}</p>
          </div>

          {friendItems.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">No friends yet</p>
              <p className="text-muted-foreground text-sm">Search for users to add friends</p>
            </div>
          ) : (
            <>
              {onlineItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Online — {onlineItems.length}
                    </span>
                  </div>

                  <FriendsList
                    items={onlineItems}
                    onMessageClick={handleMessageClick}
                    onProfileClick={(friend) => navigate(`/profile/${friend.id}`)}
                  />
                </div>
              )}

              {offlineItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Offline — {offlineItems.length}
                    </span>
                  </div>

                  <FriendsList
                    items={offlineItems}
                    onMessageClick={handleMessageClick}
                    onProfileClick={(friend) => navigate(`/profile/${friend.id}`)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <MessageSheet
          friend={selectedFriend}
          conversationId={conversationId}
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          getMessages={getMessages}
          sendMessage={sendMessage}
        />
      </div>
    </AppLayout>
  );
}
