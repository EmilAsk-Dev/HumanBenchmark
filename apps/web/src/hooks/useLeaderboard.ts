import { useState, useCallback, useEffect } from "react";
import { TestType, TimeFilter } from "@/types";
import { api } from "@/lib/api";

type LeaderboardData = {
  game: number;
  scope: number;
  timeframe: number;
  totalUsers: number;
  entries: {
    rank: number;
    userId: string;
    userName: string;
    avatarUrl?: string | null;
    bestScore: number;
    achievedAtUtc: string;
  }[];
  me?: {
    attempts: number;
    bestScore: number;
    bestAtUtc: string;
    rank: number;
    percentile: number;
  };
};





export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardData | null>(null);
  const [testType, setTestType] = useState<TestType>("reaction");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (type: TestType = "reaction", time: TimeFilter = "daily") => {
    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await api.getLeaderboard(type, time);

    if (apiError || !data) {
      setTestType(type);
      setTimeFilter(time);
      setEntries(null);
      setError(apiError ?? "Failed to load leaderboard");
      setIsLoading(false);
      return;
    }

    setTestType(type);
    setTimeFilter(time);
    setEntries(data as unknown as LeaderboardData);
    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard("reaction", "daily");
  }, [fetchLeaderboard]);

  const getUserRank = useCallback(
    (userId: string): number | undefined => {
      const entry = entries?.entries?.find((e) => e.userId === userId);
      return entry?.rank;
    },
    [entries],
  );

  return {
    entries,
    testType,
    timeFilter,
    isLoading,
    error,
    fetchLeaderboard,
    getUserRank,
    setTestType,
    setTimeFilter,
  };
}
