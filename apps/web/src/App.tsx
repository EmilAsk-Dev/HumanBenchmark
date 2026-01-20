import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Feed from "./pages/Feed";
import Tests from "./pages/Tests";
import Leaderboards from "./pages/Leaderboards";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ReactionPage from "./pages/tests/ReactionPage";
import ChimpPage from "./pages/tests/ChimpPage";
import TypingPage from "./pages/tests/TypingPage";
import SequencePage from "./pages/tests/SequencePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/reaction" element={<ReactionPage />} />
          <Route path="/tests/chimp" element={<ChimpPage />} />
          <Route path="/tests/typing" element={<TypingPage />} />
          <Route path="/tests/sequence" element={<SequencePage />} />
          <Route path="/quick-test" element={<Navigate to="/tests/reaction" replace />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
