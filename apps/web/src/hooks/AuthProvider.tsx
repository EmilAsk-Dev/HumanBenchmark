import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

type AuthContextValue = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    register: (email: string, password: string, username: string, dateOfBirth?: string, gender?: string) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshMe = useCallback(async () => {
        const me = await api.getMe();
        if (me.data) setUser(me.data);
        else setUser(null);
    }, []);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            await refreshMe();
            setIsLoading(false);
        })();
    }, [refreshMe]);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        const res = await api.login(email, password);
        if (res.error) {
            setIsLoading(false);
            setError("Login failed");
            return { error: "Login failed" };
        }

        await refreshMe();
        setIsLoading(false);
        return { error: null };
    }, [refreshMe]);

    const register = useCallback(async (email: string, password: string, username: string, dateOfBirth?: string, gender?: string) => {
        setIsLoading(true);
        setError(null);

        const res = await api.register(email, password, username, dateOfBirth, gender);
        if (res.error) {
            setIsLoading(false);
            setError("Registration failed");
            return { error: "Registration failed" };
        }

        await refreshMe();
        setIsLoading(false);
        return { error: null };
    }, [refreshMe]);

    const logout = useCallback(async () => {
        setIsLoading(true);
        await api.logout();
        setUser(null);
        setIsLoading(false);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
    }), [user, isLoading, error, login, register, logout, clearError]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
