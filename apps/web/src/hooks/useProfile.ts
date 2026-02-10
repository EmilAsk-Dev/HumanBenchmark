import { useState, useCallback } from "react";
import { User, TestStats, Badge } from "@/types";
import { api } from "@/lib/api";

type PbByTest = Record<
  string,
  {
    createdAt: string;
    displayScore: string;
    game: number;
    value: number;
    statistics: {
      reaction: any | null;
      chimp: any | null;
      typing: any | null;
      sequence: any | null;
    } | null;
  }
>;

type FetchArgs = {
  userId?: string;
  username?: string;
};

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<TestStats[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [pbByTest, setPbByTest] = useState<PbByTest>({});
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [seriesByTest, setSeriesByTest] = useState<Record<string, any>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (args?: FetchArgs) => {
    setIsLoading(true);
    setError(null);

    let profileResult;

    if (args?.username) {
      profileResult = await api.getUserProfileByUsername(args.username);
    } else if (args?.userId) {
      profileResult = await api.getProfile(args.userId);
    } else {
      profileResult = await api.getProfile();
    }

    if (profileResult.error) {
      setError(profileResult.error);
      setIsLoading(false);
      return;
    }

    const p = profileResult.data as any;

    const u: User = {
      id: p.userId ?? p.id,
      userName: p.userName ?? p.username,
      avatarUrl: p.avatarUrl ?? p.avatar ?? undefined,
      avatar: p.avatar ?? p.avatarUrl ?? undefined,
      createdAt: p.createdAt ?? new Date().toISOString(),
      totalSessions: p.totalSessions ?? 0,
      streak: p.streakDays ?? p.streak ?? 0,
    };

    setUser(u);

    setPbByTest((p.pbByTest ?? {}) as PbByTest);
    setRecentRuns(p.recentRuns ?? []);
    setSeriesByTest(p.seriesByTest ?? {});

    setBadges([]);
    setStats([]);

    setIsLoading(false);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await api.updateProfile(updates);

    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return { error: apiError };
    }

    setUser((prev) => (prev ? { ...prev, ...(data as any) } : (data as any)));
    setIsLoading(false);
    return { error: null };
  }, []);

  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);

  return {
    user,
    stats,
    badges,
    unlockedBadges,
    lockedBadges,
    pbByTest,
    recentRuns,
    seriesByTest,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  };
}
