import { useEffect, useState } from "react";

type HealthResponse = {
    status: string;
};

export default function Health() {
    const [loading, setLoading] = useState(true);
    const [ok, setOk] = useState<boolean | null>(null);
    const [data, setData] = useState<HealthResponse | null>(null);
    const [ms, setMs] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function ping() {
        setLoading(true);
        setError(null);
        setOk(null);
        setData(null);
        setMs(null);

        const started = performance.now();
        try {
            const res = await fetch("/api/health", { cache: "no-store" });
            const elapsed = performance.now() - started;

            setMs(Math.round(elapsed));
            setOk(res.ok);

            const json = (await res.json()) as HealthResponse;
            setData(json);
        } catch (e) {
            const elapsed = performance.now() - started;
            setMs(Math.round(elapsed));
            setOk(false);
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        ping();
    }, []);

    return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h1>Health</h1>

            <button onClick={ping} disabled={loading}>
                {loading ? "Pinging..." : "Ping again"}
            </button>

            <div style={{ marginTop: 16 }}>
                <div>
                    <strong>API reachable:</strong>{" "}
                    {ok === null ? "-" : ok ? "✅ Yes" : "❌ No"}
                </div>

                <div>
                    <strong>Response time:</strong> {ms === null ? "-" : `${ms} ms`}
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Response:</strong>
                    <pre
                        style={{
                            background: "#000000",
                            padding: 12,
                            borderRadius: 8,
                            overflowX: "auto",
                        }}
                    >
                        {error
                            ? `Error: ${error}`
                            : data
                                ? JSON.stringify(data, null, 2)
                                : "-"}
                    </pre>
                </div>
            </div>
        </div>
    );
}
