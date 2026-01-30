import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Feed from "./pages/Feed";
import Friends from "./pages/Friends";
import FriendProfile from "./pages/FriendProfile";
import Tests from "./pages/Tests";
import Leaderboards from "./pages/Leaderboards";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ReactionPage from "./pages/tests/ReactionPage";
import ChimpPage from "./pages/tests/ChimpPage";
import TypingPage from "./pages/tests/TypingPage";
import SequencePage from "./pages/tests/SequencePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import { AuthProvider } from "@/hooks/AuthProvider";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <FriendProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests"
              element={
                <ProtectedRoute>
                  <Tests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests/reaction"
              element={
                <ProtectedRoute>
                  <ReactionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests/chimp"
              element={
                <ProtectedRoute>
                  <ChimpPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests/typing"
              element={
                <ProtectedRoute>
                  <TypingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests/sequence"
              element={
                <ProtectedRoute>
                  <SequencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quick-test"
              element={
                <ProtectedRoute>
                  <Navigate to="/tests/reaction" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboards"
              element={
                <ProtectedRoute>
                  <Leaderboards />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
