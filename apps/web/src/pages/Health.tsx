import { useEffect, useState } from "react";
import Page from "../components/Page";

type HealthResponse = { status: string };

export default function Health() {
    const [loading, setLoading] = useState(true);
    const [ok, setOk] = useState<boolean | null>(null);
    const [ms, setMs] = useState<number | null>(null);
    const [data, setData] = useState<HealthResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function ping() {
        setLoading(true);
        setError(null);
        setOk(null);
        setMs(null);
        setData(null);

        const start = performance.now();
        try {
            const res = await fetch("/api/health", { cache: "no-store" });
            setMs(Math.round(performance.now() - start));
            setOk(res.ok);
            setData((await res.json()) as HealthResponse);
        } catch (e) {
            setMs(Math.round(performance.now() - start));
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
        <Page>
            <div style={{ padding: 24 }}>
                <h1>Health (Protected)</h1>
                <button onClick={ping} disabled={loading}>
                    {loading ? "Pinging..." : "Ping /api/health"}
                </button>

                <div style={{ marginTop: 16 }}>
                    <div><strong>Reachable:</strong> {ok === null ? "-" : ok ? "✅" : "❌"}</div>
                    <div><strong>Time:</strong> {ms === null ? "-" : `${ms} ms`}</div>
                    <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
                        {error ? `Error: ${error}` : data ? JSON.stringify(data, null, 2) : "-"}
                    </pre>
                </div>
            </div>
        </Page>
    );
}