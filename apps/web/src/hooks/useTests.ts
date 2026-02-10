import { useState, useCallback } from "react";
import { TestType } from "@/types";
import { api } from "@/lib/api";
import { AttemptDto } from "@/types/test";

export function useTests() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



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

  return {
    isLoading,
    error,
    submitTestResult,
  };
}
