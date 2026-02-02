import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the auth hook
vi.mock("@/hooks/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: "test-user", email: "test@example.com" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock pages to avoid complex dependencies
vi.mock("../pages/Feed", () => ({ default: () => <div data-testid="feed-page">Feed Page</div> }));
vi.mock("../pages/Tests", () => ({ default: () => <div data-testid="tests-page">Tests Page</div> }));
vi.mock("../pages/Leaderboards", () => ({ default: () => <div data-testid="leaderboards-page">Leaderboards Page</div> }));
vi.mock("../pages/Profile", () => ({ default: () => <div data-testid="profile-page">Profile Page</div> }));
vi.mock("../pages/Login", () => ({ default: () => <div data-testid="login-page">Login Page</div> }));
vi.mock("../pages/NotFound", () => ({ default: () => <div data-testid="notfound-page">Not Found Page</div> }));
vi.mock("../pages/tests/ReactionPage", () => ({ default: () => <div data-testid="reaction-page">Reaction Page</div> }));
vi.mock("../pages/tests/ChimpPage", () => ({ default: () => <div data-testid="chimp-page">Chimp Page</div> }));
vi.mock("../pages/tests/TypingPage", () => ({ default: () => <div data-testid="typing-page">Typing Page</div> }));
vi.mock("../pages/tests/SequencePage", () => ({ default: () => <div data-testid="sequence-page">Sequence Page</div> }));

// Import after mocks
import Feed from "../pages/Feed";
import Tests from "../pages/Tests";
import Leaderboards from "../pages/Leaderboards";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import ReactionPage from "../pages/tests/ReactionPage";
import ChimpPage from "../pages/tests/ChimpPage";
import TypingPage from "../pages/tests/TypingPage";
import SequencePage from "../pages/tests/SequencePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithRouter = (initialRoute: string) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/reaction" element={<ReactionPage />} />
          <Route path="/tests/chimp" element={<ChimpPage />} />
          <Route path="/tests/typing" element={<TypingPage />} />
          <Route path="/tests/sequence" element={<SequencePage />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Route Tests", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe("Valid Routes", () => {
    it("renders Feed page at /", () => {
      renderWithRouter("/");
      expect(screen.getByTestId("feed-page")).toBeInTheDocument();
    });

    it("renders Login page at /login", () => {
      renderWithRouter("/login");
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    it("renders Tests page at /tests", () => {
      renderWithRouter("/tests");
      expect(screen.getByTestId("tests-page")).toBeInTheDocument();
    });

    it("renders Reaction page at /tests/reaction", () => {
      renderWithRouter("/tests/reaction");
      expect(screen.getByTestId("reaction-page")).toBeInTheDocument();
    });

    it("renders Chimp page at /tests/chimp", () => {
      renderWithRouter("/tests/chimp");
      expect(screen.getByTestId("chimp-page")).toBeInTheDocument();
    });

    it("renders Typing page at /tests/typing", () => {
      renderWithRouter("/tests/typing");
      expect(screen.getByTestId("typing-page")).toBeInTheDocument();
    });

    it("renders Sequence page at /tests/sequence", () => {
      renderWithRouter("/tests/sequence");
      expect(screen.getByTestId("sequence-page")).toBeInTheDocument();
    });

    it("renders Leaderboards page at /leaderboards", () => {
      renderWithRouter("/leaderboards");
      expect(screen.getByTestId("leaderboards-page")).toBeInTheDocument();
    });

    it("renders Profile page at /profile", () => {
      renderWithRouter("/profile");
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    });
  });

  describe("Invalid Routes - 404 Handling", () => {
    it("renders NotFound page for /invalid-route", () => {
      renderWithRouter("/invalid-route");
      expect(screen.getByTestId("notfound-page")).toBeInTheDocument();
    });

    it("renders NotFound page for /tests/invalid-test", () => {
      renderWithRouter("/tests/invalid-test");
      expect(screen.getByTestId("notfound-page")).toBeInTheDocument();
    });

    it("renders NotFound page for /some/deep/invalid/path", () => {
      renderWithRouter("/some/deep/invalid/path");
      expect(screen.getByTestId("notfound-page")).toBeInTheDocument();
    });

    it("renders NotFound page for /profile/settings (non-existent nested route)", () => {
      renderWithRouter("/profile/settings");
      expect(screen.getByTestId("notfound-page")).toBeInTheDocument();
    });
  });

  describe("Route Configuration", () => {
    const validRoutes = [
      "/",
      "/login",
      "/tests",
      "/tests/reaction",
      "/tests/chimp",
      "/tests/typing",
      "/tests/sequence",
      "/leaderboards",
      "/profile",
    ];

    it.each(validRoutes)("route %s does not render 404", (route) => {
      renderWithRouter(route);
      expect(screen.queryByTestId("notfound-page")).not.toBeInTheDocument();
    });
  });
});
