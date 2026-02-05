import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameType = "Reaction" | "Typing" | "ChimpTest" | "SequenceTest" | string;

type ReactionDetailsDto = { bestMs: number; avgMs: number; attempts: number };
type TypingDetailsDto = { wpm: number; accuracy: number; characters: number };
type ChimpDetailsDto = { level: number; mistakes: number; timeMs: number };
type SequenceDetailsDto = { level: number; mistakes: number; timeMs: number };

type AttemptDetailsDto = {
    reaction?: ReactionDetailsDto | null;
    typing?: TypingDetailsDto | null;
    chimp?: ChimpDetailsDto | null;
    sequence?: SequenceDetailsDto | null;
};

type PostDto = {
    id: number;
    createdAt: string;
    userId: string;
    userName: string;
    avatarUrl?: string | null;
    game: GameType;
    value: number;
    displayScore: string;
    percentile?: number | null;
    caption?: string | null;
    likeCount: number;
    commentCount: number;
    isLikedByMe: boolean;
    details?: AttemptDetailsDto | null;
};

type GetPostResponse = { post: PostDto };

function formatGameLabel(game: GameType) {
    switch (game) {
        case "Reaction":
            return "Reaction";
        case "Typing":
            return "Typing";
        case "ChimpTest":
            return "Chimp";
        case "SequenceTest":
            return "Sequence";
        default:
            return String(game);
    }
}

function formatWhen(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

export default function PostPage() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();

    const [post, setPost] = useState<PostDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const numericPostId = useMemo(() => {
        const n = Number(postId);
        return Number.isFinite(n) ? n : null;
    }, [postId]);

    useEffect(() => {
        if (!numericPostId) {
            setError("Invalid post id.");
            return;
        }

        let cancelled = false;

        (async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/posts/${numericPostId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `HTTP ${res.status}`);
                }

                const data = (await res.json()) as GetPostResponse;
                if (!cancelled) setPost(data.post);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Failed to load post");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [numericPostId]);

    const detailsBlock = useMemo(() => {
        const d = post?.details;
        if (!d) return null;

        if (d.reaction) {
            return (
                <div className="grid grid-cols-3 gap-3">
                    <Stat label="Best" value={`${d.reaction.bestMs} ms`} />
                    <Stat label="Average" value={`${d.reaction.avgMs} ms`} />
                    <Stat label="Rounds" value={`${d.reaction.attempts}`} />
                </div>
            );
        }

        if (d.typing) {
            return (
                <div className="grid grid-cols-3 gap-3">
                    <Stat label="WPM" value={`${d.typing.wpm}`} />
                    <Stat label="Accuracy" value={`${d.typing.accuracy}%`} />
                    <Stat label="Chars" value={`${d.typing.characters}`} />
                </div>
            );
        }

        if (d.chimp) {
            return (
                <div className="grid grid-cols-3 gap-3">
                    <Stat label="Level" value={`${d.chimp.level}`} />
                    <Stat label="Mistakes" value={`${d.chimp.mistakes}`} />
                    <Stat label="Time" value={`${d.chimp.timeMs} ms`} />
                </div>
            );
        }

        if (d.sequence) {
            return (
                <div className="grid grid-cols-3 gap-3">
                    <Stat label="Level" value={`${d.sequence.level}`} />
                    <Stat label="Mistakes" value={`${d.sequence.mistakes}`} />
                    <Stat label="Time" value={`${d.sequence.timeMs} ms`} />
                </div>
            );
        }

        return null;
    }, [post]);

    return (
        <AppLayout>
            <div className="mx-auto w-full max-w-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-foreground">Post</h1>
                </div>

                {isLoading && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="h-5 w-40 bg-muted/40 rounded mb-3" />
                        <div className="h-10 w-56 bg-muted/40 rounded mb-3" />
                        <div className="h-4 w-full bg-muted/40 rounded mb-2" />
                        <div className="h-4 w-2/3 bg-muted/40 rounded" />
                    </div>
                )}

                {!isLoading && error && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-destructive text-sm whitespace-pre-wrap">
                            {error}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" onClick={() => navigate("/feed")}>
                                Go to feed
                            </Button>
                            <Button onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    </div>
                )}

                {!isLoading && !error && post && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                    {post.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={post.avatarUrl}
                                            alt={post.userName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            {post.userName?.slice(0, 1)?.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">
                                        {post.userName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatWhen(post.createdAt)} • {formatGameLabel(post.game)}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-lg font-bold text-foreground">
                                    {post.displayScore}
                                </div>
                                {post.percentile != null && (
                                    <div
                                        className={cn(
                                            "text-xs font-semibold",
                                            post.percentile >= 90 ? "text-yellow-500" : "text-primary",
                                        )}
                                    >
                                        Top {Math.max(0, 100 - post.percentile)}%
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Caption */}
                        {post.caption && post.caption.trim().length > 0 && (
                            <p className="mt-4 text-foreground whitespace-pre-wrap">
                                {post.caption}
                            </p>
                        )}

                        {/* Details */}
                        {detailsBlock && (
                            <div className="mt-4 rounded-lg border border-border bg-background p-3">
                                {detailsBlock}
                            </div>
                        )}

                        {/* Footer meta */}
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                            <div>
                                ❤️ {post.likeCount} • 💬 {post.commentCount}
                            </div>
                            <div className="text-xs">Post #{post.id}</div>
                        </div>

                        {/* Actions (optional placeholder) */}
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" onClick={() => navigate("/feed")}>
                                Back to feed
                            </Button>
                            {/* You can add Like / Comment actions here later */}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-base font-bold text-foreground">{value}</div>
        </div>
    );
}
