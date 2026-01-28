import { useState, useCallback, useEffect } from 'react';
import { User, TestStats, Badge } from '@/types';
import { api } from '@/lib/api';

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<TestStats[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);

    const profileResult = await api.getProfile(userId);

    if (profileResult.error) {
      setError(profileResult.error);
      setIsLoading(false);
      return;
    }

    const p = profileResult.data as any;

    setUser({
      id: p.userId,
      username: p.userName,
      displayName: p.userName,
      totalSessions: p.totalSessions ?? 0,
      streak: p.streakDays ?? 0,
    } as User);

    // tills API har stöd för detta
    setBadges([]);
    setStats([]);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await api.updateProfile(updates);

    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return { error: apiError };
    }

    setUser(prev => (prev ? { ...prev, ...data } : data));
    setIsLoading(false);
    return { error: null };
  }, []);

  const unlockedBadges = badges.filter(b => b.isUnlocked);
  const lockedBadges = badges.filter(b => !b.isUnlocked);

  return {
    user,
    stats,
    badges,
    unlockedBadges,
    lockedBadges,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  };
}
