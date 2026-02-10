import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the app is hydrating auth state (initial /me on page load). */
  isLoading: boolean;
  /** True while an auth mutation is in-flight (login/register/logout). */
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (
    email: string,
    password: string,
    username: string,
    dateOfBirth?: string,
    gender?: string,
    avatarUrl?: string
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didInitRef = useRef(false);

  const refreshMe = useCallback(async () => {
    const me = await api.getMe();
    if (me.data) setUser(me.data);
    else setUser(null);
  }, []);

  useEffect(() => {
    // In React 18 StrictMode (dev), effects can run twice on mount.
    // Guard to avoid duplicate /me calls and flicker.
    if (didInitRef.current) return;
    didInitRef.current = true;

    (async () => {
      setIsLoading(true);
      await refreshMe();
      setIsLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsSubmitting(true);
      setError(null);

      const res = await api.login(email, password);
      if (res.error) {
        setIsSubmitting(false);
        setError("Wrong Credentials");
        return { error: "Wrong credentials" };
      }

      await refreshMe();
      setIsSubmitting(false);
      return { error: null };
    },
    [refreshMe]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      username: string,
      dateOfBirth?: string,
      gender?: string,
      avatarUrl?: string
    ) => {
      setIsSubmitting(true);
      setError(null);

      const res = await api.register(email, password, username, dateOfBirth, gender, avatarUrl);
      if (res.error) {
        setIsSubmitting(false);
        setError("Registration failed");
        return { error: "Registration failed" };
      }

      await refreshMe();
      setIsSubmitting(false);
      return { error: null };
    },
    [refreshMe]
  );

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    await api.logout();
    setUser(null);
    setIsSubmitting(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isSubmitting,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, isLoading, isSubmitting, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
