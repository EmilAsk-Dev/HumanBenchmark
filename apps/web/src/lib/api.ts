import { LikeTargetType } from "../types/index.js";
import { TestType } from "@/types";
import type { CreateAttemptRequest, AttemptDto } from "@/types/test";
export function likeTargetTypeToRoute(
  type: LikeTargetType,
): "post" | "comment" {
  return type === LikeTargetType.Post ? "post" : "comment";
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: "/api",
  ENDPOINTS: {
    // Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",

    // Users
    USERS: "/users",
    USER_PROFILE: "/profile/:id",
    SEARCH_USERS: "/users/search",

    // Feed
    FEED: "/feed",
    POSTS: "/posts",
    POST: "/posts/:id",
    LIKE: "/likes",
    UNLIKE: "/likes/:targetType/:targetId",
    COMMENTS: "/posts/:id/comments",

    // Tests (kan vara 404 om backend inte har dessa ännu)
    ATTEMPTS: "/attempts",
    TEST_RESULTS: "/tests/results",
    TEST_STATS: "/tests/stats",
    SUBMIT_TEST: "/tests/submit",
    DAILY_TEST: "/tests/daily",

    // Leaderboards (backend kör plural)
    LEADERBOARD: "/leaderboards",

    // Profile
    PROFILE: "/profile",
    BADGES: "/badges",

    // Friends
    FRIENDS: "/friends",
    FRIEND_REQUESTS: "/friends/requests",
    FRIEND_REQUEST_ACTION: "/friends/requests/:id",
    SEND_FRIEND_REQUEST: "/friends/requests",
    REMOVE_FRIEND: "/friends/:id",
    OUTGOING_FRIEND_REQUESTS: "/friends/requests/outgoing",

    // Messages
    CONVERSATIONS: "/messages/conversations",
    MESSAGES: "/messages/:friendId",
    SEND_MESSAGE: "/messages/:friendId",
  },
};

// Token management
let authToken: string | null = localStorage.getItem("auth_token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
      const body = isJson
        ? JSON.stringify(await response.json())
        : await response.text();
      return {
        data: null,
        error: body || `HTTP error ${response.status}`,
      };
    }

    if (!isJson) {
      const text = await response.text();
      return {
        data: null,
        error: `Expected JSON but got ${contentType || "unknown"}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as T;
    console.log(
      `[apiRequest] response ${url}`,
      response.status,
      response.statusText,
      data,
    );
    return { data, error: null };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Helper to replace path params
function replaceParams(
  endpoint: string,
  params: Record<string, string>,
): string {
  let result = endpoint;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

// API Methods
export const api = {
  // Auth
  async login(email: string, password: string) {
    const result = await apiRequest<{ user: any; token: string }>(
      API_CONFIG.ENDPOINTS.LOGIN,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }

    return result;
  },

  async register(
    email: string,
    password: string,
    username: string,
    dateOfBirth?: string,
    gender?: string,
    avatarUrl?: string,
  ) {
    const result = await apiRequest<{ user: any; token: string }>(
      API_CONFIG.ENDPOINTS.REGISTER,
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          username,
          dateOfBirth,
          gender,
          avatarUrl,
        }),
      },
    );

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }

    return result;
  },

  async logout() {
    const result = await apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: "POST",
    });
    setAuthToken(null);
    return result;
  },

  async getMe() {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.ME);
  },

  // Feed
  async getFeed() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.FEED);
  },

  async getPosts(filter: string = "global") {
    return apiRequest<any[]>(`${API_CONFIG.ENDPOINTS.POSTS}?filter=${filter}`);
  },

  async createPost(attemptId: number, caption?: string) {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.POSTS, {
      method: "POST",
      body: JSON.stringify({ attemptId, caption: caption?.trim() || null }),
    });
  },

  async like(targetId: string | number, targetType: LikeTargetType) {
    return apiRequest(API_CONFIG.ENDPOINTS.LIKE, {
      method: "POST",
      body: JSON.stringify({
        targetType,
        targetId: Number(targetId),
      }),
    });
  },

  async unlike(targetId: string | number, targetType: LikeTargetType) {
    return apiRequest(
      replaceParams(API_CONFIG.ENDPOINTS.UNLIKE, {
        targetType: likeTargetTypeToRoute(targetType),
        targetId: String(targetId),
      }),
      { method: "DELETE" },
    );
  },

  async getComments(postId: string) {
    return apiRequest<any[]>(
      replaceParams(API_CONFIG.ENDPOINTS.COMMENTS, { id: postId }),
    );
  },

  async addComment(postId: string, content: string, parentCommentId?: string) {
    return apiRequest<any>(
      replaceParams(API_CONFIG.ENDPOINTS.COMMENTS, { id: postId }),
      {
        method: "POST",
        body: JSON.stringify({
          content,
          parentCommentId: parentCommentId ? Number(parentCommentId) : null,
        }),
      },
    );
  },

  // Tests (om backend saknar routes kommer du få 404 – det är OK)
  async getTestStats() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.TEST_STATS);
  },

  async submitTestResult(testType: TestType, score: number, details: any) {
    const payload: CreateAttemptRequest =
      testType === "reaction"
        ? { game: "reaction", value: score, reaction: details }
        : testType === "chimp"
          ? { game: "chimp", value: score, chimp: details }
          : testType === "typing"
            ? { game: "typing", value: score, typing: details }
            : { game: "sequence", value: score, sequence: details };

    return apiRequest<AttemptDto>(API_CONFIG.ENDPOINTS.ATTEMPTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getDailyTest() {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.DAILY_TEST);
  },

  // Leaderboard (matchar backend: game/scope/timeframe)
  async getLeaderboard(testType: string, timeFilter: string) {
    const gameMap: Record<string, string> = {
      reaction: "Reaction",
      chimp: "ChimpTest",
      typing: "Typing",
      sequence: "SequenceTest",
    };

    const timeframeMap: Record<string, string> = {
      allTime: "All",
      daily: "Day",
      weekly: "Week",
      monthly: "Month",
    };

    const game = gameMap[testType] ?? "Reaction";
    const timeframe = timeframeMap[timeFilter] ?? "All";
    const scope = "Global";

    return apiRequest<any[]>(
      `${API_CONFIG.ENDPOINTS.LEADERBOARD}?game=${encodeURIComponent(game)}&scope=${encodeURIComponent(scope)}&timeframe=${encodeURIComponent(timeframe)}`,
    );
  },

  // Profile
  async getProfile(userId?: string) {
    const endpoint = userId
      ? replaceParams(API_CONFIG.ENDPOINTS.USER_PROFILE, { id: userId })
      : API_CONFIG.ENDPOINTS.PROFILE;
    return apiRequest<any>(endpoint);
  },

  async updateProfile(updates: any) {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.PROFILE, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async getBadges() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.BADGES);
  },

  // Friends
  async getFriends() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.FRIENDS);
  },

  async getFriendRequests() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.FRIEND_REQUESTS);
  },

  async getOutgoingFriendRequests() {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.OUTGOING_FRIEND_REQUESTS, {
      method: "GET",
    });
  },

  async sendFriendRequest(toUserId: string) {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.SEND_FRIEND_REQUEST, {
      method: "POST",
      body: JSON.stringify({ toUserId }),
    });
  },

  async acceptFriendRequest(requestId: string) {
    return apiRequest<any>(
      replaceParams(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_ACTION, {
        id: requestId,
      }),
      { method: "POST", body: JSON.stringify({ action: "accept" }) },
    );
  },

  async declineFriendRequest(requestId: string) {
    return apiRequest<any>(
      replaceParams(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_ACTION, {
        id: requestId,
      }),
      { method: "POST", body: JSON.stringify({ action: "decline" }) },
    );
  },

  async removeFriend(friendId: string) {
    return apiRequest<any>(
      replaceParams(API_CONFIG.ENDPOINTS.REMOVE_FRIEND, { id: friendId }),
      { method: "DELETE" },
    );
  },

  async searchUsers(query: string) {
    return apiRequest<any[]>(
      `${API_CONFIG.ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query)}`,
    );
  },

  // Messages
  async getConversations() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.CONVERSATIONS);
  },

  async getMessages(friendId: string) {
    return apiRequest<any[]>(
      replaceParams(API_CONFIG.ENDPOINTS.MESSAGES, { friendId }),
    );
  },

  async sendMessage(friendId: string, content: string) {
    return apiRequest<any>(
      replaceParams(API_CONFIG.ENDPOINTS.SEND_MESSAGE, { friendId }),
      { method: "POST", body: JSON.stringify({ content }) },
    );
  },
};
