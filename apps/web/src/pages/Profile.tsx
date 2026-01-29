import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { TEST_CONFIGS } from "@/types";
import {
  Crown,
  Flame,
  Gamepad2,
  LogOut,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FriendSearchProfile } from "@/components/profile/FriendSearchProfile";

export default function Profile() {
  const navigate = useNavigate();
  const {
    user,
    stats,
    badges,
    unlockedBadges,
    lockedBadges,
    isLoading,
    error,
  } = useProfile();
  const { logout, isAuthenticated } = useAuth();
  const [showFriendSearch, setShowFriendSearch] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">
            {error || "Could not load profile"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* Header with search */}
        <div className="flex items-center justify-between mb-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-foreground"
          >
            Profil
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFriendSearch(!showFriendSearch)}
              className={
                showFriendSearch ? "text-primary" : "text-muted-foreground"
              }
            >
              <Users className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {showFriendSearch && (
            <FriendSearchProfile onClose={() => setShowFriendSearch(false)} />
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user.avatar}
            alt=""
            className="w-20 h-20 rounded-full border-4 border-primary/30"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {user.displayName}
            </h2>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {user.totalSessions}
            </div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold text-foreground">
              {user.streak}
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold text-foreground">
              {unlockedBadges.length}
            </div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h2 className="font-bold text-foreground mb-3">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30"
              >
                <span className="text-lg mr-1">{badge.icon}</span>
                <span className="text-sm font-medium text-foreground">
                  {badge.name}
                </span>
              </div>
            ))}
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="px-3 py-2 rounded-lg bg-muted opacity-50"
              >
                <span className="text-lg mr-1">🔒</span>
                <span className="text-sm text-muted-foreground">
                  {badge.name}
                </span>
              </div>
            ))}
            {badges.length === 0 && (
              <p className="text-sm text-muted-foreground">No badges yet</p>
            )}
          </div>
        </div>

        {/* Test Stats */}
        <div className="mb-6">
          <h2 className="font-bold text-foreground mb-3">Your Stats</h2>
          {stats.length > 0 ? (
            <div className="space-y-3">
              {stats.map((stat) => {
                const config = TEST_CONFIGS[stat.testType];
                return (
                  <div
                    key={stat.testType}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">
                        {config.name}
                      </span>
                      <span className="text-primary font-bold">
                        Top {100 - stat.percentile}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-bold text-foreground">
                          {stat.personalBest}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Best
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          {stat.median}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Median
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          {stat.totalAttempts}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Attempts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No test results yet. Start playing to see your stats!
            </p>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </AppLayout>
  );
}
