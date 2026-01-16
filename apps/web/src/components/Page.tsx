import type { ReactNode } from "react";

export default function Page({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 24,
            }}
        >
            <div style={{ width: "100%", maxWidth: 520 }}>{children}</div>
        </div>
    );
}
