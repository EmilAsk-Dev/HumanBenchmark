import { useState, useCallback, useEffect } from 'react';
import { LeaderboardEntry, TestType, TimeFilter } from '@/types';
import { api } from '@/lib/api';

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
