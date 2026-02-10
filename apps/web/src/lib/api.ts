import { FeedFilter, LikeTargetType } from "../types/index.js";
import { TestType } from "@/types";
import type { CreateAttemptRequest, AttemptDto } from "@/types/test";
import { useNotifications } from "@/contexts/NotificationsContext";
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
    USER_PROFILE_BY_USERNAME: "/profile/username/:username",
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
    SUBMIT_TEST: "/tests/submit",

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

let inflight = new Map<string, Promise<{ data: any; error: string | null }>>();

let csrfToken: string | null = null;
let csrfInflight: Promise<string | null> | null = null;

function clearCsrfToken() {
  csrfToken = null;
  csrfInflight = null;
}

async function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken;
  if (csrfInflight) return csrfInflight;

  csrfInflight = (async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/csrf`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) return null;

      const data = (await res.json()) as { token?: string };
      if (data?.token) csrfToken = data.token;
      return csrfToken;
    } catch {
      return null;
    } finally {
      csrfInflight = null;
    }
  })();

  return csrfInflight;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  hasRetriedCsrf = false,
): Promise<{ data: T | null; error: string | null }> {
  const method = (options.method ?? "GET").toUpperCase();

  // Only dedupe GET by default (safe). You can add HEAD too if you want.
  const shouldDedupe = method === "GET";
  const isUnsafeMethod = !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);

  // Include body in key only if it exists (usually none for GET)
  const bodyKey =
    typeof options.body === "string"
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : "";

  const key = `${method}:${endpoint}:${bodyKey}`;

  if (shouldDedupe) {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<{ data: T | null; error: string | null }>;
  }

  const p = (async () => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    };

    if (isUnsafeMethod) {
      const token = await ensureCsrfToken();
      if (token) {
        (headers as Record<string, string>)["X-CSRF-TOKEN"] = token;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (response.status === 204 || response.status === 205) {
        return { data: null, error: null };
      }

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      // Special-case 429 so you can see it clearly
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const text = await response.text().catch(() => "");
        return {
          data: null,
          error:
            `Rate limited (429). Retry-After: ${retryAfter ?? "unknown"}. ` +
            (text ? text.slice(0, 200) : ""),
        };
      }

      if (!response.ok) {
        const body = isJson
          ? JSON.stringify(await response.json())
          : await response.text();

        // If auth state changed, a previously issued antiforgery token can become invalid.
        // Clear and retry once for unsafe methods.
        if (
          isUnsafeMethod &&
          !hasRetriedCsrf &&
          response.status === 400 &&
          typeof body === "string" &&
          body.includes("Invalid CSRF token")
        ) {
          clearCsrfToken();
          return apiRequest<T>(endpoint, options, true);
        }

        return { data: null, error: body || `HTTP error ${response.status}` };
      }

      if (!isJson) {
        const text = await response.text();
        if (!text) return { data: null, error: null };
        return {
          data: null,
          error: `Expected JSON but got ${contentType || "unknown"}: ${text.slice(0, 200)}`,
        };
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Network error",
      };
    } finally {
      if (shouldDedupe) inflight.delete(key);
    }
  })();

  if (shouldDedupe) inflight.set(key, p);
  return p;
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
  clearCsrfToken,

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

    // If auth state changed, refresh CSRF token on next unsafe request.
    if (!result.error) clearCsrfToken();

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

    // If auth state changed, refresh CSRF token on next unsafe request.
    if (!result.error) clearCsrfToken();

    return result;
  },

  async logout() {
    const result = await apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: "POST",
    });
    setAuthToken(null);
    clearCsrfToken();
    return result;
  },

  async getMe() {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.ME);
  },

  // Feed
  async getFeed(
    filter: FeedFilter = 'friends',
    take = 50,
    skip = 0
  ) {
    return apiRequest<any[]>(
      `${API_CONFIG.ENDPOINTS.FEED}?filter=${filter}&take=${take}&skip=${skip}`
    );
  },

  async getPosts(filter: string = "global") {
    return apiRequest<any[]>(`${API_CONFIG.ENDPOINTS.POSTS}?filter=${filter}`);
  },

  async createPost(isPublic: boolean, attemptId: number, caption?: string) {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.POSTS, {
      method: "POST",
      body: JSON.stringify({
        attemptId,
        caption: caption?.trim(),
        isPublic,
      }),
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

    return apiRequest<any>(
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

  async getUserProfileByUsername(username: string) {
    const endpoint = replaceParams(API_CONFIG.ENDPOINTS.USER_PROFILE_BY_USERNAME, {
      username,
    });
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
      replaceParams(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_ACTION, { id: requestId }),
      { method: "POST", body: JSON.stringify({ accept: true }) },
    );
  },

  async declineFriendRequest(requestId: string) {
    return apiRequest<any>(
      replaceParams(API_CONFIG.ENDPOINTS.FRIEND_REQUEST_ACTION, { id: requestId }),
      { method: "POST", body: JSON.stringify({ accept: false }) },
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
