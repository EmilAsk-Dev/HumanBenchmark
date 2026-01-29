import { LikeTargetType } from '../types/index.js';

export function likeTargetTypeToRoute(type: LikeTargetType): "post" | "comment" {
  return type === LikeTargetType.Post ? "post" : "comment";
}

// API Configuration - Update these values to match your backend
export const API_CONFIG = {
  BASE_URL: 'api', // Replace with your API URL
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',

    // Users
    USERS: '/users',
    USER_PROFILE: '/users/:id',

    // Feed
    FEED: '/feed',
    POSTS: '/posts',
    POST: '/posts/:id',
    LIKE: "/likes",
    UNLIKE: "/likes/:targetType/:targetId",
    COMMENTS: '/posts/:id/comments',

    // Tests
    TEST_RESULTS: '/tests/results',
    TEST_STATS: '/tests/stats',
    SUBMIT_TEST: '/tests/submit',
    DAILY_TEST: '/tests/daily',

    // Leaderboards
    LEADERBOARD: '/leaderboard',

    // Profile
    PROFILE: '/profile',
    BADGES: '/badges',
  }
};

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  console.log("[apiRequest]", options.method ?? "GET", url);

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
      const body = isJson ? JSON.stringify(await response.json()) : await response.text();
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
    console.log("[apiRequest] response", response.status, response.statusText, data);
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
function replaceParams(endpoint: string, params: Record<string, string>): string {
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
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }

    return result;
  },

  async register(email: string, password: string, username: string, dateOfBirth?: Date, gender?: string) {
    const result = await apiRequest<{ user: any; token: string }>(
      API_CONFIG.ENDPOINTS.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify({ email, password, username, dateOfBirth, gender }),
      }
    );

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }

    return result;
  },

  async logout() {
    const result = await apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
    setAuthToken(null);
    return result;
  },

  async getMe() {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.ME);
  },

  // Feed

  async getFeed() {
    return apiRequest<any[]>(`${API_CONFIG.ENDPOINTS.FEED}`);
  },

  async getPosts(filter: string = 'global') {
    return apiRequest<any[]>(`${API_CONFIG.ENDPOINTS.POSTS}?filter=${filter}`);
  },

  async like(targetId: string | number, targetType: LikeTargetType) {
    return apiRequest(
      API_CONFIG.ENDPOINTS.LIKE,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: Number(targetId),
        }),
      }
    );
  },

  async unlike(targetId: string | number, targetType: LikeTargetType) {
    return apiRequest(
      replaceParams(API_CONFIG.ENDPOINTS.UNLIKE, {
        targetType: likeTargetTypeToRoute(targetType),
        targetId: String(targetId),
      }),
      { method: "DELETE" }
    );
  },

  async getComments(postId: string) {
    return apiRequest<any[]>(
      replaceParams(API_CONFIG.ENDPOINTS.COMMENTS, { id: postId })
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
      }
    );
  },

  // Tests
  async getTestStats() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.TEST_STATS);
  },

  async submitTestResult(testType: string, score: number) {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.SUBMIT_TEST, {
      method: 'POST',
      body: JSON.stringify({ testType, score }),
    });
  },

  async getDailyTest() {
    return apiRequest<any>(API_CONFIG.ENDPOINTS.DAILY_TEST);
  },

  // Leaderboard
  async getLeaderboard(testType: string, timeFilter: string) {
    return apiRequest<any[]>(
      `${API_CONFIG.ENDPOINTS.LEADERBOARD}?testType=${testType}&timeFilter=${timeFilter}`
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
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async getBadges() {
    return apiRequest<any[]>(API_CONFIG.ENDPOINTS.BADGES);
  },
};
