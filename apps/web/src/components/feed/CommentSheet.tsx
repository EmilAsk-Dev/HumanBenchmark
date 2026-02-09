// src/components/feed/CommentSheet.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Comment, LikeTargetType } from "@/types";
import { cn } from "@/lib/utils";

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (content: string, parentCommentId?: string) => Promise<{ error?: string | null }>;
  postId: string;
  onLike: (targetId: string, targetType: LikeTargetType) => void;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function countCommentsTree(list: Comment[] = []): number {
  return list.reduce((acc, c) => acc + 1 + countCommentsTree(c.replies ?? []), 0);
}

function stripLeadingMention(text: string, username?: string) {
  if (!username) return text;
  const prefix = `@${username} `;
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

function CommentRow({
  comment,
  depth,
  onLike,
  onReply,
  children,
}: {
  comment: Comment;
  depth: number;
  onLike: (targetId: string, targetType: LikeTargetType) => void;
  onReply: (commentId: string, username: string) => void;
  children?: React.ReactNode;
}) {
  const avatar = comment.user?.avatar ?? "/avatar-placeholder.png";
  const displayName = comment.user?.userName ?? "Unknown";
  const username = comment.user?.userName ?? "unknown";

  return (
    <div className={cn("flex gap-3 py-3", depth > 0 && "pl-4 border-l border-border/60")}>
      <img
        src={avatar}
        alt={displayName}
        className={cn("rounded-full bg-muted flex-shrink-0", depth > 0 ? "h-8 w-8" : "h-10 w-10")}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{displayName}</span>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(new Date(comment.createdAt))}</span>
        </div>

        <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>

        <div className="flex items-center gap-4 mt-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onLike(comment.id, LikeTargetType.Comment)}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              comment.isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <motion.div animate={comment.isLiked ? { scale: [1, 1.3, 1] } : {}}>
              <Heart className={cn("h-4 w-4", comment.isLiked && "fill-current")} />
            </motion.div>
            <span>{comment.likes}</span>
          </motion.button>

          <button
            onClick={() => onReply(comment.id, username)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reply
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export function CommentSheet({
  isOpen,
  onClose,
  comments,
  onAddComment,
  postId,
  onLike,
}: CommentSheetProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });


    setNewComment(prev => {
      const cleaned = prev.trim().length ? prev : "";
      if (cleaned.startsWith(`@${username}`)) return cleaned;
      return `@${username} `;
    });

    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = newComment.trim();
    if (!trimmed || isSubmitting) return;

    const content = replyingTo
      ? stripLeadingMention(trimmed, replyingTo.username).trim()
      : trimmed;

    if (!content) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const { error: submitError } = await onAddComment(content, replyingTo?.id);

    if (submitError) {
      try {
        const parsed = JSON.parse(submitError);
        setErrorMsg(parsed.reason ?? parsed.error ?? submitError);
      } catch {
        setErrorMsg(submitError);
      }
      setIsSubmitting(false);
      return;
    }

    setNewComment("");
    setReplyingTo(null);
    setIsSubmitting(false);
  };

  const totalCount = countCommentsTree(comments ?? []);

  const renderComment = (comment: Comment, depth: number, index: number) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ delay: index * 0.03 }}
    >
      <CommentRow comment={comment} depth={depth} onLike={onLike} onReply={handleReply}>
        {!!comment.replies?.length && (
          <div className="mt-1">
            {comment.replies.map((r, i) => renderComment(r, depth + 1, i))}
          </div>
        )}
      </CommentRow>
    </motion.div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-3xl px-0 pb-0 bg-background border-t border-border"
      >
        {/* Header */}
        <SheetHeader className="px-4 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-semibold">
            {totalCount} {totalCount === 1 ? "comment" : "comments"}
          </SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 h-[calc(70vh-140px)]">
          <AnimatePresence mode="popLayout">
            {totalCount === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground"
              >
                <p className="text-lg font-medium">No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </motion.div>
            ) : (
              comments.map((comment, index) => renderComment(comment, 0, index))
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="relative border-t border-border p-4 bg-background">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 right-4 mb-1 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm shadow-sm"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between mb-2 text-sm"
              >
                <span className="text-muted-foreground">
                  Replying to <span className="text-primary font-medium">@{replyingTo.username}</span>
                </span>
                <button
                  onClick={cancelReply}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cancel reply"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || isSubmitting}
                className="rounded-full gradient-primary text-primary-foreground"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
