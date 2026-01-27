import { useState, useCallback, useEffect } from 'react';
import { TestRun, TestType, TestStats, DailyTest } from '@/types';
import { api } from '@/lib/api';

export function useTests() {
  const [stats, setStats] = useState<TestStats[]>([]);
  const [dailyTest, setDailyTest] = useState<DailyTest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [statsResult, dailyResult] = await Promise.all([
        api.getTestStats(),
        api.getDailyTest(),
      ]);

      if (statsResult.data) {
        setStats(statsResult.data);
      }

      if (dailyResult.data) {
        setDailyTest(dailyResult.data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getStatsForTest = useCallback((testType: TestType): TestStats | undefined => {
    return stats.find(s => s.testType === testType);
  }, [stats]);

  const submitTestResult = useCallback(async (testType: TestType, score: number): Promise<TestRun | null> => {
    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await api.submitTestResult(testType, score);

    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return null;
    }

    // Update local stats with the new result
    if (data?.stats) {
      setStats(prev => prev.map(s =>
        s.testType === testType ? data.stats : s
      ));
    }

    setIsLoading(false);
    return data?.testRun || null;
  }, []);

  const completeDailyTest = useCallback(() => {
    setDailyTest(prev => prev ? { ...prev, isCompleted: true } : null);
  }, []);

  return {
    stats,
    dailyTest,
    isLoading,
    error,
    getStatsForTest,
    submitTestResult,
    completeDailyTest,
  };
}
