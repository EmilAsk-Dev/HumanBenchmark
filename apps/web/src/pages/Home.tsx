import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Page from "../components/Page";


export default function Home() {
    const { logout } = useAuth();

    return (
        <Page>
            <div style={{ padding: 24 }}>
                <h1>Home (Protected)</h1>
                <p>You’re logged in.</p>

                <div style={{ display: "flex", gap: 12 }}>
                    <Link to="/health">Go to Health</Link>
                    <button onClick={logout}>Log out</button>
                </div>
            </div>
        </Page>
    );
}
