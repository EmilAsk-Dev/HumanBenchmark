import { useState, useEffect, useCallback, useMemo } from "react";
import { Friend, FriendRequest, Conversation, Message } from "@/types/friends";
import { api } from "@/lib/api";

export interface FriendListItem {
  user: Friend;
  createdAt: string;
}

export type FriendRequestItem = {
  id: string;
  createdAt: string;
  user: Friend;
};

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

  const [outgoingRequestItems, setOutgoingRequestItems] = useState<FriendRequestItem[]>([]);

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
        userName: x.user?.userName ?? x.user?.username ?? "",
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

    const mapped: FriendRequest[] = (data || []).map((r: any) => {
      const fromObj = r.from ?? r.fromUser ?? r.user ?? r.sender ?? null;

      if (fromObj) {
        return {
          id: String(r.id),
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          from: {
            id: fromObj.id,
            userName: fromObj.userName ?? fromObj.username ?? "",
            avatar: fromObj.avatarUrl ?? fromObj.avatar ?? "",
            status: fromObj.status ?? "offline",
            lastSeen: fromObj.lastSeen ? new Date(fromObj.lastSeen) : undefined,
            currentGame: fromObj.currentGame ?? undefined,
          },
        };
      }

      return {
        id: String(r.id),
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        from: {
          id: r.fromUserId ?? r.fromId ?? "",
          userName: r.fromUserName ?? r.fromUsername ?? "Unknown",
          avatar: "",
          status: "offline",
        },
      };
    });

    setState((prev) => ({
      ...prev,
      requests: mapped,
    }));
  }, []);

  const fetchOutgoingRequests = useCallback(async () => {
    const { data, error } = await api.getOutgoingFriendRequests();

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return;
    }

    const mapped: FriendRequestItem[] = (data || []).map((r: any) => {
      const toObj = r.to ?? r.toUser ?? r.user ?? r.receiver ?? null;

      const user: Friend = toObj
        ? {
          id: toObj.id,
          userName: toObj.userName ?? toObj.username ?? "",
          avatar: toObj.avatarUrl ?? toObj.avatar ?? "",
          status: toObj.status ?? "offline",
          lastSeen: toObj.lastSeen ? new Date(toObj.lastSeen) : undefined,
          currentGame: toObj.currentGame ?? undefined,
        }
        : {
          id: r.toUserId ?? r.toId ?? "",
          userName: r.toUserName ?? r.toUsername ?? "Unknown",
          avatar: "",
          status: "offline",
        };

      return {
        id: String(r.id),
        createdAt: r.createdAt ?? "",
        user,
      };
    });

    setOutgoingRequestItems(mapped);
  }, []);

  const fetchConversations = useCallback(async () => {
    const { data, error } = await api.getConversations();

    if (error) {
      setState((prev) => ({ ...prev, error }));
      return;
    }

    const mapped: Conversation[] = (data || []).map((c: any) => ({
      friend: {
        id: c.friendId,
        userName: "",
        avatar: "",
        status: "offline",
      },
      messages: [],
      lastMessage: undefined,
      unreadCount: 0,
    }));

    setState((prev) => ({
      ...prev,
      conversations: mapped,
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

    await fetchOutgoingRequests();

    return { success: true, error: null };
  }, [fetchOutgoingRequests]);

  const acceptRequest = useCallback(
    async (requestId: string) => {
      const { error } = await api.acceptFriendRequest(requestId);

      if (error) {
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      await fetchFriends();
      await fetchRequests();

      return { success: true, error: null };
    },
    [fetchFriends, fetchRequests],
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      const { error } = await api.declineFriendRequest(requestId);

      if (error) {
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      await fetchRequests();

      return { success: true, error: null };
    },
    [fetchRequests],
  );

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

    const mapped: Message = {
      id: String(data.id),
      senderId: data.senderId,
      receiverId: friendId,
      content: data.content,
      createdAt: new Date(data.sentAt),
      isRead: true,
    };

    setState((prev) => {
      const idx = prev.conversations.findIndex((c) => c.friend.id === friendId);
      if (idx < 0) return prev;

      const updated = [...prev.conversations];
      updated[idx] = {
        ...updated[idx],
        messages: [...updated[idx].messages, mapped],
        lastMessage: mapped,
      };

      return { ...prev, conversations: updated };
    });

    return { success: true, error: null, message: data };
  }, []);

  const getMessages = useCallback(async (friendId: string): Promise<Message[]> => {
    const { data, error } = await api.getMessages(friendId);
    if (error) return [];

    return (data || []).map((m: any) => ({
      id: String(m.id),
      senderId: m.senderId,
      receiverId: friendId,
      content: m.content,
      createdAt: new Date(m.sentAt),
      isRead: true,
    })) as Message[];
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchOutgoingRequests();
    fetchConversations();
  }, [fetchFriends, fetchRequests, fetchOutgoingRequests, fetchConversations]);

  const friends = useMemo(() => state.friendItems.map((x) => x.user), [state.friendItems]);

  const onlineItems = useMemo(
    () => state.friendItems.filter((x) => x.user.status === "online" || x.user.status === "playing"),
    [state.friendItems],
  );

  const offlineItems = useMemo(
    () => state.friendItems.filter((x) => x.user.status !== "online" && x.user.status !== "playing"),
    [state.friendItems],
  );

  const incomingRequests: FriendRequestItem[] = useMemo(
    () =>
      state.requests.map((r) => ({
        id: String(r.id),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        user: r.from,
      })),
    [state.requests],
  );

  return {
    friends,
    friendItems: state.friendItems,
    onlineItems,
    offlineItems,
    incomingRequests,
    outgoingRequests: outgoingRequestItems,
    conversations: state.conversations,
    isLoading: state.isLoading,
    error: state.error,
    fetchFriends,
    fetchRequests,
    fetchOutgoingRequests,
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
