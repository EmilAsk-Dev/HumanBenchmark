import { useState, useCallback, useEffect } from "react";
import { LeaderboardEntry, TestType, TimeFilter } from "@/types";
import { api } from "@/lib/api";

// Mock leaderboard data for fallback
const mockLeaderboardData: Record<TestType, LeaderboardEntry[]> = {
  reaction: [
    {
      rank: 1,
      user: {
        id: "1",
        username: "reflexmaster",
        displayName: "Jake Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jake",
        createdAt: new Date(),
        streak: 5,
        totalSessions: 120,
      },
      score: 156,
      percentile: 99,
      testType: "reaction",
    },
    {
      rank: 2,
      user: {
        id: "2",
        username: "speedster99",
        displayName: "Emma Swift",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        createdAt: new Date(),
        streak: 12,
        totalSessions: 89,
      },
      score: 187,
      percentile: 97,
      testType: "reaction",
    },
    {
      rank: 3,
      user: {
        id: "3",
        username: "typequeen",
        displayName: "Sofia Rodriguez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
        createdAt: new Date(),
        streak: 8,
        totalSessions: 156,
      },
      score: 195,
      percentile: 95,
      testType: "reaction",
    },
  ],
  chimp: [
    {
      rank: 1,
      user: {
        id: "2",
        username: "brainiac42",
        displayName: "Marcus Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
        createdAt: new Date(),
        streak: 15,
        totalSessions: 78,
      },
      score: 14,
      percentile: 99,
      testType: "chimp",
    },
    {
      rank: 2,
      user: {
        id: "5",
        username: "memoryking",
        displayName: "Aisha Patel",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
        createdAt: new Date(),
        streak: 20,
        totalSessions: 112,
      },
      score: 13,
      percentile: 97,
      testType: "chimp",
    },
    {
      rank: 3,
      user: {
        id: "1",
        username: "speedster99",
        displayName: "Emma Swift",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        createdAt: new Date(),
        streak: 12,
        totalSessions: 89,
      },
      score: 12,
      percentile: 95,
      testType: "chimp",
    },
  ],
  typing: [
    {
      rank: 1,
      user: {
        id: "3",
        username: "typequeen",
        displayName: "Sofia Rodriguez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
        createdAt: new Date(),
        streak: 8,
        totalSessions: 156,
      },
      score: 134,
      percentile: 99,
      testType: "typing",
    },
    {
      rank: 2,
      user: {
        id: "1",
        username: "speedster99",
        displayName: "Emma Swift",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        createdAt: new Date(),
        streak: 12,
        totalSessions: 89,
      },
      score: 112,
      percentile: 97,
      testType: "typing",
    },
    {
      rank: 3,
      user: {
        id: "2",
        username: "brainiac42",
        displayName: "Marcus Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
        createdAt: new Date(),
        streak: 15,
        totalSessions: 78,
      },
      score: 98,
      percentile: 95,
      testType: "typing",
    },
  ],
  sequence: [
    {
      rank: 1,
      user: {
        id: "5",
        username: "memoryking",
        displayName: "Aisha Patel",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
        createdAt: new Date(),
        streak: 20,
        totalSessions: 112,
      },
      score: 15,
      percentile: 99,
      testType: "sequence",
    },
    {
      rank: 2,
      user: {
        id: "2",
        username: "brainiac42",
        displayName: "Marcus Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
        createdAt: new Date(),
        streak: 15,
        totalSessions: 78,
      },
      score: 11,
      percentile: 97,
      testType: "sequence",
    },
    {
      rank: 3,
      user: {
        id: "1",
        username: "speedster99",
        displayName: "Emma Swift",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        createdAt: new Date(),
        streak: 12,
        totalSessions: 89,
      },
      score: 9,
      percentile: 95,
      testType: "sequence",
    },
  ],
};

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry>();
  const [testType, setTestType] = useState<TestType>('reaction');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (type: TestType, time: TimeFilter) => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: apiError } = await api.getLeaderboard(testType, time);
    
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return;
    }
    
    setTestType(type);
    setTimeFilter(time);
    setEntries(data as LeaderboardEntry);
    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard(testType, timeFilter);
  }, []);

  const getUserRank = useCallback((userId: string): number | undefined => {
    const entry = entries.entries.find(e => e.userId === userId);
    return entry?.rank;
  }, [entries]);

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
