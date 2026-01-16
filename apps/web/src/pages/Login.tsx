import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Page from "../components/Page";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const location = useLocation() as any;
    const from = location.state?.from ?? "/";

    return (
        <Page>
            <h1>Login</h1>
            <p>This is a placeholder. Click to “log in”.</p>

            <button
                onClick={() => {
                    login();
                    nav(from, { replace: true });
                }}
            >
                Log in
            </button>
        </Page>
    );
}
