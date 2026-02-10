import { useMemo, useState, type CSSProperties } from "react";
import { Heart, MessageCircle, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Post, TEST_CONFIGS, LikeTargetType, Comment } from "@/types";
import { Button } from "@/components/ui/button";
import { CommentSheet } from "./CommentSheet";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  post: Post;
  onLike: (targetId: string, targetType: LikeTargetType) => void;
  onAddComment?: (postId: string, content: string, parentCommentId?: string) => Promise<{ error?: string | null }>;
  index?: number;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 95) return "text-yellow-500";
  if (percentile >= 80) return "text-primary";
  if (percentile >= 50) return "text-success";
  return "text-muted-foreground";
}

function countComments(comments: Comment[] = []): number {
  return comments.reduce((acc, c) => acc + 1 + countComments(c.replies ?? []), 0);
}

function formatMs(ms: number) {
  if (!Number.isFinite(ms)) return "-";
  return `${ms}ms`;
}

function formatAccuracy(acc: number) {
  if (!Number.isFinite(acc)) return "-";
  const pct = acc <= 1 ? acc * 100 : acc; // supports 0-1 or 0-100
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

export function FeedCard({ post, onLike, onAddComment, index = 0 }: FeedCardProps) {
  const config = TEST_CONFIGS[post.testRun.testType] ?? TEST_CONFIGS.reaction;
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const avatarSrc = (post.user.avatarUrl ?? "").trim();
  const displayName = post.user.userName ?? "Unknown";
  const username = post.user.userName ?? "unknown";
  const caption = (post.caption ?? "").trim();
  const captionIsLong = caption.length > 120;
  const initials = (displayName.trim()?.[0] ?? "?").toUpperCase();

  const statistics: any = (post as any).testRun?.statistics;

  const statBlocks = useMemo(() => {
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

    // Typing
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

    // Chimp
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

    // Sequence
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
  }, [statistics]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm transition-colors hover:bg-card"
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          {avatarSrc ? (
            <motion.img
              src={avatarSrc}
              alt={displayName}
              className="h-10 w-10 rounded-full bg-muted object-cover"
              whileHover={{ scale: 1.1 }}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.endsWith("/avatars/avatar-1.png")) img.src = "/avatars/avatar-1.png";
              }}
            />
          ) : (
            <motion.div
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground"
              whileHover={{ scale: 1.1 }}
            >
              {initials}
            </motion.div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-foreground">{displayName}</span>
              <span className="text-xs text-muted-foreground">@{username}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{config.name}</span>
              <span>•</span>
              <span>{formatTimeAgo(new Date(post.createdAt))}</span>
            </div>
          </div>
        </div>

        {caption && (
          <div className="mb-4">
            <p
              className="text-lg font-semibold leading-snug text-foreground"
              style={
                captionExpanded
                  ? undefined
                  : ({
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    } as CSSProperties)
              }
            >
              {caption}
            </p>
            {captionIsLong && (
              <button
                type="button"
                onClick={() => setCaptionExpanded((v) => !v)}
                className="mt-1 text-sm text-primary hover:underline"
              >
                {captionExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
        {/* Score Display */}
        <motion.div
          className="mb-4 flex items-center justify-between rounded-xl bg-muted/50 p-4"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${config.color}20` }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-2xl" style={{ color: config.color }}>
                {config.icon === "Zap" && "⚡"}
                {config.icon === "Brain" && "🧠"}
                {config.icon === "Keyboard" && "⌨️"}
                {config.icon === "Grid3x3" && "🔲"}
              </span>
            </motion.div>

            <div>
              <div className="text-3xl font-bold text-foreground">
                {post.testRun.score}
                <span className="ml-1 text-lg font-normal text-muted-foreground">{config.unit}</span>
              </div>
            </div>
          </div>

          <div className={cn("text-right", getPercentileColor(post.testRun.percentile))}>
            <div className="text-2xl font-bold">Top {100 - post.testRun.percentile}%</div>
            <div className="text-xs text-muted-foreground">Percentile: {post.testRun.percentile}</div>
          </div>
        </motion.div>

        {/* Stats */}
        {statBlocks && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Stats</span>
              <span className="text-xs text-muted-foreground">{config.name}</span>
            </div>
            {statBlocks}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => onLike(post.id, LikeTargetType.Post)}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                post.isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              )}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div animate={post.isLiked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart className={cn("h-5 w-5", post.isLiked && "fill-current")} />
              </motion.div>
              <span>{post.likeCount}</span>
            </motion.button>

            <motion.button
              onClick={() => setIsCommentSheetOpen(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{countComments(post.comments ?? [])}</span>
            </motion.button>
          </div>

          <Link to={`/tests/${post.testRun.testType}`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" className="gradient-primary gap-2 border-0 text-primary-foreground">
                <Play className="h-4 w-4" />
                Try This Test
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      <CommentSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        comments={post.comments ?? []}
        postId={post.id}
        onLike={onLike}
        onAddComment={async (content, parentId) => {
          const result = await onAddComment?.(post.id, content, parentId);
          return { error: result?.error ?? null };
        }}
      />
    </>
  );
}
