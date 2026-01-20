import { useState, useCallback, useEffect } from 'react';
import { LeaderboardEntry, TestType, TimeFilter } from '@/types';
import { api } from '@/lib/api';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [testType, setTestType] = useState<TestType>('reaction');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('allTime');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (type: TestType, time: TimeFilter) => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: apiError } = await api.getLeaderboard(type, time);
    
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return;
    }
    
    setTestType(type);
    setTimeFilter(time);
    setEntries(data || []);
    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard(testType, timeFilter);
  }, []);

  const getUserRank = useCallback((userId: string): number | undefined => {
    const entry = entries.find(e => e.user.id === userId);
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
