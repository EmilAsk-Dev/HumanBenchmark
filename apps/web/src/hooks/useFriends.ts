import { useState, useEffect, useCallback } from "react";
import { Friend, FriendRequest, Conversation, Message } from "@/types/friends";
import { api } from "@/lib/api";

interface FriendsState {
  friends: Friend[];
  requests: FriendRequest[];
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
}

export function useFriends() {
  const [state, setState] = useState<FriendsState>({
    friends: [],
    requests: [],
    conversations: [],
    isLoading: true,
    error: null,
  });

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await api.getFriends();

    if (error) {
      setState((prev) => ({ ...prev, isLoading: false, error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      friends: data || [],
      isLoading: false,
    }));
  }, []);

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    const { data, error } = await api.getFriendRequests();

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      requests: data || [],
    }));
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const { data, error } = await api.getConversations();

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      conversations: data || [],
    }));
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<Friend[]> => {
    if (!query.trim()) return [];

    const { data, error } = await api.searchUsers(query);

    if (error) {
      console.error("Search error:", error);
      return [];
    }

    return data || [];
  }, []);

  // Send friend request
  const sendFriendRequest = useCallback(async (userId: string) => {
    const { error } = await api.sendFriendRequest(userId);

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    return { success: true, error: null };
  }, []);

  // Accept friend request
  const acceptRequest = useCallback(async (requestId: string) => {
    const { data, error } = await api.acceptFriendRequest(requestId);

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    // Update local state
    setState((prev) => {
      const request = prev.requests.find((r) => r.id === requestId);
      if (request) {
        return {
          ...prev,
          friends: [...prev.friends, request.from],
          requests: prev.requests.filter((r) => r.id !== requestId),
        };
      }
      return prev;
    });

    return { success: true, error: null };
  }, []);

  // Decline friend request
  const declineRequest = useCallback(async (requestId: string) => {
    const { error } = await api.declineFriendRequest(requestId);

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    setState((prev) => ({
      ...prev,
      requests: prev.requests.filter((r) => r.id !== requestId),
    }));

    return { success: true, error: null };
  }, []);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    const { error } = await api.removeFriend(friendId);

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    setState((prev) => ({
      ...prev,
      friends: prev.friends.filter((f) => f.id !== friendId),
    }));

    return { success: true, error: null };
  }, []);

  // Send message
  const sendMessage = useCallback(async (friendId: string, content: string) => {
    const { data, error } = await api.sendMessage(friendId, content);

    if (error) {
      return { success: false, error };
    }

    // Update conversation in local state
    setState((prev) => {
      const conversationIndex = prev.conversations.findIndex(
        (c) => c.friend.id === friendId,
      );

      if (conversationIndex >= 0) {
        const updatedConversations = [...prev.conversations];
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          messages: [...updatedConversations[conversationIndex].messages, data],
          lastMessage: data,
        };
        return { ...prev, conversations: updatedConversations };
      }

      return prev;
    });

    return { success: true, error: null, message: data };
  }, []);

  // Get messages for a specific friend
  const getMessages = useCallback(
    async (friendId: string): Promise<Message[]> => {
      const { data, error } = await api.getMessages(friendId);

      if (error) {
        console.error("Get messages error:", error);
        return [];
      }

      return data || [];
    },
    [],
  );

  // Initial fetch
  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchConversations();
  }, [fetchFriends, fetchRequests, fetchConversations]);

  // Computed values
  const onlineFriends = state.friends.filter(
    (f) => f.status === "online" || f.status === "playing",
  );
  const offlineFriends = state.friends.filter((f) => f.status === "offline");

  return {
    ...state,
    onlineFriends,
    offlineFriends,
    fetchFriends,
    fetchRequests,
    fetchConversations,
    searchUsers,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    sendMessage,
    getMessages,
  };
}
