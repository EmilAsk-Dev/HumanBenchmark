import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (content: string) => void;
  postId: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function CommentSheet({ isOpen, onClose, comments, onAddComment, postId }: CommentSheetProps) {
  const [newComment, setNewComment] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const toggleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-3xl px-0 pb-0 bg-background border-t border-border"
      >
        {/* Header */}
        <SheetHeader className="px-4 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-semibold">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 h-[calc(70vh-140px)]">
          <AnimatePresence mode="popLayout">
            {comments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground"
              >
                <p className="text-lg font-medium">No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </motion.div>
            ) : (
              comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 py-3"
                >
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.displayName}
                    className="h-10 w-10 rounded-full bg-muted flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {comment.user.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 break-words">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleLikeComment(comment.id)}
                        className={cn(
                          'flex items-center gap-1 text-xs transition-colors',
                          likedComments.has(comment.id)
                            ? 'text-destructive'
                            : 'text-muted-foreground hover:text-destructive'
                        )}
                      >
                        <motion.div
                          animate={likedComments.has(comment.id) ? { scale: [1, 1.3, 1] } : {}}
                        >
                          <Heart
                            className={cn(
                              'h-4 w-4',
                              likedComments.has(comment.id) && 'fill-current'
                            )}
                          />
                        </motion.div>
                        <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                      </motion.button>
                      <button
                        onClick={() => handleReply(comment.id, comment.user.username)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
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
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
              className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim()}
                className="rounded-full gradient-primary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
