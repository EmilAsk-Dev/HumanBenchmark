import { useState, useEffect, useCallback, useMemo } from "react";
import { Friend, FriendRequest, Conversation, Message } from "@/types/friends";
import { api } from "@/lib/api";

export interface FriendListItem {
  user: Friend;
  createdAt: string;
}

interface FriendsState {
  friendItems: FriendListItem[];
  requests: FriendRequest[];
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
}

export function useFriends() {
  const [state, setState] = useState<FriendsState>({
    friendItems: [],
    requests: [],
    conversations: [],
    isLoading: true,
    error: null,
  });

  const fetchFriends = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await api.getFriends();

    if (error) {
      setState((prev) => ({ ...prev, isLoading: false, error }));
      return;
    }

    const mapped: FriendListItem[] = (data || []).map((x: any) => ({
      createdAt: x.createdAt,
      user: {
        id: x.user?.id,
        userName: x.user?.userName,
        avatar: x.user?.avatarUrl ?? x.user?.avatar ?? "",
        status: x.user?.status ?? "offline",
        lastSeen: x.user?.lastSeen ? new Date(x.user.lastSeen) : undefined,
        currentGame: x.user?.currentGame ?? undefined,
      } as Friend,
    }));

    setState((prev) => ({
      ...prev,
      friendItems: mapped,
      isLoading: false,
    }));
  }, []);

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

  const searchUsers = useCallback(async (query: string): Promise<Friend[]> => {
    if (!query.trim()) return [];

    const { data, error } = await api.searchUsers(query);

    if (error) return [];

    return (data || []).map((u: any) => ({
      id: u.id,
      userName: u.userName ?? u.username ?? "",
      avatar: u.avatarUrl ?? u.avatar ?? "",
      status: u.status ?? "offline",
      lastSeen: u.lastSeen ? new Date(u.lastSeen) : undefined,
      currentGame: u.currentGame ?? undefined,
    })) as Friend[];
  }, []);

  const sendFriendRequest = useCallback(async (userId: string) => {
    const { error } = await api.sendFriendRequest(userId);

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    return { success: true, error: null };
  }, []);

  const acceptRequest = useCallback(
    async (requestId: string) => {
      const { error } = await api.acceptFriendRequest(requestId);

      if (error) {
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      await fetchFriends();

      setState((prev) => ({
        ...prev,
        requests: prev.requests.filter((r) => r.id !== requestId),
      }));

      return { success: true, error: null };
    },
    [fetchFriends],
  );

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

  const removeFriend = useCallback(
    async (friendId: string) => {
      const { error } = await api.removeFriend(friendId);

      if (error) {
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      await fetchFriends();

      return { success: true, error: null };
    },
    [fetchFriends],
  );

  const sendMessage = useCallback(async (friendId: string, content: string) => {
    const { data, error } = await api.sendMessage(friendId, content);

    if (error) {
      return { success: false, error };
    }

    setState((prev) => {
      const idx = prev.conversations.findIndex((c) => c.friend.id === friendId);
      if (idx < 0) return prev;

      const updated = [...prev.conversations];
      updated[idx] = {
        ...updated[idx],
        messages: [...updated[idx].messages, data],
        lastMessage: data,
      };

      return { ...prev, conversations: updated };
    });

    return { success: true, error: null, message: data };
  }, []);

  const getMessages = useCallback(async (friendId: string): Promise<Message[]> => {
    const { data, error } = await api.getMessages(friendId);
    if (error) return [];
    return data || [];
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchConversations();
  }, [fetchFriends, fetchRequests, fetchConversations]);

  const friends = useMemo(() => state.friendItems.map((x) => x.user), [state.friendItems]);

  const onlineItems = useMemo(
    () => state.friendItems.filter((x) => x.user.status === "online" || x.user.status === "playing"),
    [state.friendItems],
  );

  const offlineItems = useMemo(
    () => state.friendItems.filter((x) => x.user.status !== "online" && x.user.status !== "playing"),
    [state.friendItems],
  );

  return {
    friends,
    friendItems: state.friendItems,
    onlineItems,
    offlineItems,
    requests: state.requests,
    conversations: state.conversations,
    isLoading: state.isLoading,
    error: state.error,
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
