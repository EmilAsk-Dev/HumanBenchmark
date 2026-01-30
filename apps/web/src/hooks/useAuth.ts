import { useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const refreshMe = useCallback(async () => {
    const me = await api.getMe();
    setAuthState(prev => ({
      ...prev,
      user: me.data ?? null,
      isAuthenticated: !!me.data,
      isLoading: false,
      error: null,
    }));
    return me.data ?? null;
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await api.login(email, password);

    if (error || !data) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error || 'Login failed',
      }));
      return { error: error || 'Login failed' };
    }

   
    await refreshMe();

    return { error: null };
  }, [refreshMe]);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await api.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    username: string,
    dateOfBirth?: string,
    gender?: string,
    avatarUrl?: string
  ) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await api.register(email, password, username, dateOfBirth, gender, avatarUrl);

    if (error || !data) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error || 'Registration failed',
      }));
      return { error: error || 'Registration failed' };
    }

    
    await refreshMe();

    return { error: null };
  }, [refreshMe]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    register,
    clearError,
  };
}
