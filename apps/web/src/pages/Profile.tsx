import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/AuthProvider";
import { TEST_CONFIGS } from "@/types";
import { Crown, Flame, Gamepad2, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------- helpers ----------
function formatMs(ms: number) {
  if (!Number.isFinite(ms)) return "-";
  return `${ms}ms`;
}

function formatAccuracy(acc: number) {
  if (!Number.isFinite(acc)) return "-";
  const pct = acc <= 1 ? acc * 100 : acc;
  return `${pct.toFixed(1)}%`;
}

function formatTimeMs(ms: number) {
  if (!Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem.toFixed(0)}s`;
}

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function BestStatsGrid({ statistics }: { statistics: any }) {
  if (!statistics) return null;

  if (statistics.reaction) {
    const best = statistics.reaction.bestMs;
    const avg = statistics.reaction.avgMs;
    const attempts = statistics.reaction.attempts;

    const consistency =
      Number.isFinite(best) && Number.isFinite(avg) && avg > 0
        ? `${Math.max(0, Math.min(100, Math.round((best / avg) * 100)))}%`
        : "-";

    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Best" value={formatMs(best)} />
        <StatPill label="Average" value={formatMs(avg)} />
        <StatPill label="Attempts" value={Number.isFinite(attempts) ? attempts : "-"} />
        <StatPill label="Consistency" value={consistency} />
      </div>
    );
  }

  if (statistics.typing) {
    const wpm = statistics.typing.wpm;
    const accuracy = statistics.typing.accuracy;
    const characters = statistics.typing.characters;

    const acc01 = Number.isFinite(accuracy) ? (accuracy <= 1 ? accuracy : accuracy / 100) : NaN;
    const errors =
      Number.isFinite(characters) && Number.isFinite(acc01) ? Math.max(0, Math.round(characters * (1 - acc01))) : null;

    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="WPM" value={Number.isFinite(wpm) ? wpm : "-"} />
        <StatPill label="Accuracy" value={formatAccuracy(accuracy)} />
        <StatPill label="Characters" value={Number.isFinite(characters) ? characters : "-"} />
        <StatPill label="Errors" value={errors ?? "-"} />
      </div>
    );
  }

  if (statistics.chimp) {
    const level = statistics.chimp.level;
    const mistakes = statistics.chimp.mistakes;
    const timeMs = statistics.chimp.timeMs;

    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Level" value={Number.isFinite(level) ? level : "-"} />
        <StatPill label="Mistakes" value={Number.isFinite(mistakes) ? mistakes : "-"} />
        <StatPill label="Time" value={formatTimeMs(timeMs)} />
        <StatPill label="Perfect run" value={(mistakes ?? 0) === 0 ? "Yes" : "No"} />
      </div>
    );
  }

  if (statistics.sequence) {
    const level = statistics.sequence.level;
    const mistakes = statistics.sequence.mistakes;
    const timeMs = statistics.sequence.timeMs;

    return (
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Level" value={Number.isFinite(level) ? level : "-"} />
        <StatPill label="Mistakes" value={Number.isFinite(mistakes) ? mistakes : "-"} />
        <StatPill label="Time" value={formatTimeMs(timeMs)} />
        <StatPill label="Perfect run" value={(mistakes ?? 0) === 0 ? "Yes" : "No"} />
      </div>
    );
  }

  return null;
}


const gameToTestType: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

export default function Profile() {
  const { username } = useParams<{ username?: string }>();

  const navigate = useNavigate();
  const {
    user,
    stats,
    badges,
    unlockedBadges,
    lockedBadges,
    pbByTest,
    isLoading,
    error,
    fetchProfile,
  } = useProfile();
  const { logout } = useAuth();

  useEffect(() => {
    if (username) {
      fetchProfile({ username });
    } else {
      fetchProfile(); // me
    }
  }, [username, fetchProfile]);

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
          <p className="text-muted-foreground">{error || "Could not load profile"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/login")}>
            Login
          </Button>
        </div>
      </AppLayout>
    );
  }

  const pbEntries = Object.entries(pbByTest ?? {});
  const avatarSrc = user.avatarUrl ?? user.avatar ?? "";
  const initials = (user.userName?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* Header with search */}
        <div className="flex items-center justify-between mb-4">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-foreground">
            Profil
          </motion.h1>
        </div>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="w-20 h-20 rounded-full border-4 border-primary/30 object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.endsWith("/avatars/avatar-1.png")) img.src = "/avatars/avatar-1.png";
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-primary/30 bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-foreground">{user.userName}</h2>
            <p className="text-muted-foreground">@{user.userName}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">{user.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold text-foreground">{user.streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold text-foreground">{unlockedBadges.length}</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>

        {/* ✅ NEW: Personal Bests */}
        <div className="mb-6">
          <h2 className="font-bold text-foreground mb-3">Personal Bests</h2>

          {pbEntries.length > 0 ? (
            <div className="space-y-3">
              {pbEntries.map(([key, pb]) => {
                const game = pb?.game as number | undefined;
                const testType = game ? gameToTestType[game] : undefined;
                const config = testType ? TEST_CONFIGS[testType] : undefined;

                const title = config?.name ?? key;
                const createdAt = pb?.createdAt ? new Date(pb.createdAt) : null;

                return (
                  <div key={key} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{title}</div>
                        <div className="text-sm text-muted-foreground">
                          PB:{" "}
                          <span className="font-semibold text-foreground">
                            {pb?.displayScore ?? pb?.value ?? "-"}
                          </span>
                        </div>
                      </div>

                      {createdAt && (
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {createdAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* stats grid */}
                    <BestStatsGrid statistics={pb?.statistics} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No personal bests yet.</p>
          )}
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h2 className="font-bold text-foreground mb-3">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            {unlockedBadges.map((badge) => (
              <div key={badge.id} className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <span className="text-lg mr-1">{badge.icon}</span>
                <span className="text-sm font-medium text-foreground">{badge.name}</span>
              </div>
            ))}
            {lockedBadges.map((badge) => (
              <div key={badge.id} className="px-3 py-2 rounded-lg bg-muted opacity-50">
                <span className="text-lg mr-1">🔒</span>
                <span className="text-sm text-muted-foreground">{badge.name}</span>
              </div>
            ))}

            {badges.length === 0 && <p className="text-sm text-muted-foreground">No badges yet</p>}
          </div>
        </div>

        {/* Your Stats (existing) */}
        <div className="mb-6">
          <h2 className="font-bold text-foreground mb-3">Your Stats</h2>
          {stats.length > 0 ? (
            <div className="space-y-3">
              {stats.map((stat) => {
                const config = TEST_CONFIGS[stat.testType];
                return (
                  <div key={stat.testType} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{config.name}</span>
                      <span className="text-primary font-bold">Top {100 - stat.percentile}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-bold text-foreground">{stat.personalBest}</div>
                        <div className="text-xs text-muted-foreground">Best</div>
                      </div>

                      <div>
                        <div className="font-bold text-foreground">{stat.median}</div>
                        <div className="text-xs text-muted-foreground">Median</div>
                      </div>

                      <div>
                        <div className="font-bold text-foreground">{stat.totalAttempts}</div>
                        <div className="text-xs text-muted-foreground">Attempts</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No test results yet. Start playing to see your stats!</p>
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
