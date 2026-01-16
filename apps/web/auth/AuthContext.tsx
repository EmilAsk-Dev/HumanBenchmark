import React, { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
    isAuthed: boolean;
    login: () => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthed, setIsAuthed] = useState(false);

    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthed,
            login: () => setIsAuthed(true),
            logout: () => setIsAuthed(false),
        }),
        [isAuthed]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
