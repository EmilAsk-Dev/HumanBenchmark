import { useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { api, getAuthToken, setAuthToken } from '@/lib/api';

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

  // Check for existing session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe().then(({ data, error }) => {
        if (data && !error) {
          setAuthState({
            user: data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthToken(null);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

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
    
    setAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    
    return { error: null };
  }, []);

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
    gender?: string
  ) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { data, error } = await api.register(email, password, username, dateOfBirth, gender);
    
    if (error || !data) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error || 'Registration failed',
      }));
      return { error: error || 'Registration failed' };
    }
    
    setAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    
    return { error: null };
  }, []);

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
