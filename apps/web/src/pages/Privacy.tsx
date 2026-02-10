import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Privacy</h1>
          <p className="text-sm text-muted-foreground">
            A short summary of what data the app handles and why.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Personal data we may store</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Email address and username</li>
            <li>Avatar (profile picture)</li>
            <li>Date of birth and gender (optional, if you provide them)</li>
            <li>Test results and statistics</li>
            <li>Posts, comments, and likes</li>
            <li>Friends and messages (if you use those features)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Technical data</h2>
          <p className="text-sm text-muted-foreground">
            To keep you signed in, the API uses a session cookie. The server may also process your IP address for
            rate limiting and troubleshooting (logs/telemetry).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Why we store data</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Authentication and account functionality</li>
            <li>Showing your profile and stats</li>
            <li>Social features (feed, posts, comments, likes)</li>
            <li>Friends and messaging</li>
          </ul>
        </section>

        <div className="pt-2 text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
