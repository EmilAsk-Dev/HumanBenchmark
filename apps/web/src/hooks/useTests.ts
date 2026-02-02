import { useState, useCallback, useEffect } from "react";
import { TestType, TestStats, DailyTest } from "@/types";
import { api } from "@/lib/api";
import { AttemptDto } from "@/types/test";

export function useTests() {
  const [stats, setStats] = useState<TestStats[]>([]);
  const [dailyTest, setDailyTest] = useState<DailyTest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [statsResult, dailyResult] = await Promise.all([
        api.getTestStats(),
        api.getDailyTest(),
      ]);

      if (statsResult.data) {
        setStats(statsResult.data as TestStats[]);
      }

      if (dailyResult.data) {
        setDailyTest(dailyResult.data as DailyTest);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getStatsForTest = useCallback(
    (testType: TestType): TestStats | undefined => {
      return stats.find((s) => s.testType === testType);
    },
    [stats],
  );



  const submitTestResult = useCallback(
    async (testType: TestType, score: number, details: any): Promise<AttemptDto | null> => {
      setIsLoading(true);
      setError(null);

      const { data, error: apiError } = await api.submitTestResult(testType, score, details);

      if (apiError) {
        setError(apiError);
        setIsLoading(false);
        return null;
      }

      setIsLoading(false);
      return data ?? null;
    },
    [],
  );

  const completeDailyTest = useCallback(() => {
    setDailyTest((prev) => (prev ? { ...prev, isCompleted: true } : null));
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
