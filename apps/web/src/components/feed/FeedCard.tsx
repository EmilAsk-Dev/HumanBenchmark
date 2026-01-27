import { useState } from 'react';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Post, TEST_CONFIGS, Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { CommentSheet } from './CommentSheet';
import { cn } from '@/lib/utils';
import { mockUsers } from '@/lib/mockData';

interface FeedCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  index?: number;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 95) return 'text-yellow-500';
  if (percentile >= 80) return 'text-primary';
  if (percentile >= 50) return 'text-success';
  return 'text-muted-foreground';
}

export function FeedCard({ post, onLike, onAddComment, index = 0 }: FeedCardProps) {
  const config = TEST_CONFIGS[post.testRun.testType];
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments);

  const handleAddComment = (content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      user: mockUsers[0],
      content,
      createdAt: new Date(),
      likes: 0,
    };
    setLocalComments(prev => [newComment, ...prev]);
    onAddComment?.(post.id, content);
  };



  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="border-b border-border bg-card p-4 transition-colors hover:bg-accent/50"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <motion.img
            src={post.user.avatar}
            alt={post.user.displayName}
            className="h-10 w-10 rounded-full bg-muted"
            whileHover={{ scale: 1.1 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">
                {post.user.displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                @{post.user.username}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{config.name}</span>
              <span>•</span>
              <span>{formatTimeAgo(new Date(post.createdAt))}</span>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <motion.div
          className="flex items-center justify-between mb-4 p-4 rounded-xl bg-muted/50"
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${config.color}20` }}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-2xl" style={{ color: config.color }}>
                {config.icon === 'Zap' && '⚡'}
                {config.icon === 'Brain' && '🧠'}
                {config.icon === 'Keyboard' && '⌨️'}
                {config.icon === 'Grid3x3' && '🔲'}
              </span>
            </motion.div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {post.testRun.score}
                <span className="text-lg font-normal text-muted-foreground ml-1">
                  {config.unit}
                </span>
              </div>
            </div>
          </div>
          <div className={cn('text-right', getPercentileColor(post.testRun.percentile))}>
            <div className="text-2xl font-bold">Top {100 - post.testRun.percentile}%</div>
            <div className="text-xs text-muted-foreground">Percentile: {post.testRun.percentile}</div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => onLike(post.id)}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                post.isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
              )}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={post.isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn('h-5 w-5', post.isLiked && 'fill-current')} />
              </motion.div>
              <span>{post.likeCount}</span>
            </motion.button>
            <motion.button
              onClick={() => setIsCommentSheetOpen(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{localComments.length}</span>
            </motion.button>
          </div>

          <Link to={`/tests/${post.testRun.testType}`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" className="gap-2 gradient-primary text-primary-foreground border-0">
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
        comments={localComments}
        onAddComment={handleAddComment}
        postId={post.id}
      />
    </>
  );
}
