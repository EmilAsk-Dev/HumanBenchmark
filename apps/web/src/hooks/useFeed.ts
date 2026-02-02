// src/hooks/useFeed.ts
import { useState, useCallback, useEffect } from "react";
import { Post, FeedFilter, LikeTargetType, Comment } from "@/types";
import { api } from "@/lib/api";
import { normalizePosts, normalizeComment } from "@/lib/normalize";
import { useAuth } from "@/hooks/AuthProvider"; // adjust path
function findCommentInTree(comments: Comment[], id: string): Comment | undefined {
  for (const c of comments) {
    if (c.id === id) return c;
    const found = c.replies?.length ? findCommentInTree(c.replies, id) : undefined;
    if (found) return found;
  }
  return undefined;
}

function updateCommentTree(
  comments: Comment[],
  targetId: string,
  updater: (c: Comment) => Comment
): Comment[] {
  return comments.map(c => {
    if (c.id === targetId) return updater(c);

    const replies = c.replies?.length
      ? updateCommentTree(c.replies, targetId, updater)
      : c.replies;

    if (replies !== c.replies) return { ...c, replies };
    return c;
  });
}

function insertReply(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map(c => {
    if (c.id === parentId) {
      return { ...c, replies: [reply, ...(c.replies ?? [])] };
    }
    if (!c.replies?.length) return c;
    return { ...c, replies: insertReply(c.replies, parentId, reply) };
  });
}

export function useFeed() {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("global");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (feedFilter: FeedFilter) => {
    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await api.getFeed();

    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return;
    }

    setFilter(feedFilter);
    setPosts(normalizePosts(data ?? []));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts(filter);
  }, [fetchPosts, filter]);

  const refreshFeed = useCallback(async () => {
    setIsRefreshing(true);

    const { data, error: apiError } = await api.getFeed();
    if (!apiError) setPosts(normalizePosts(data ?? []));

    setIsRefreshing(false);
  }, []);

  const likeTarget = useCallback(
    async (targetId: string, targetType: LikeTargetType) => {
      const currentLiked =
        targetType === LikeTargetType.Post
          ? posts.find(p => p.id === targetId)?.isLiked ?? false
          : (() => {
            for (const p of posts) {
              const hit = findCommentInTree(p.comments ?? [], targetId);
              if (hit) return hit.isLiked;
            }
            return false;
          })();

      const shouldLike = !currentLiked;

      setPosts(prev =>
        prev.map(post => {
          if (targetType === LikeTargetType.Post) {
            console.log("Updating post", post.id, targetId);

            if (post.id !== targetId) return post;
            return {
              ...post,
              isLiked: shouldLike,
              likeCount: shouldLike ? post.likeCount + 1 : post.likeCount - 1,
            };
          }

          return {
            ...post,
            comments: updateCommentTree(post.comments ?? [], targetId, comment => ({
              ...comment,
              isLiked: shouldLike,
              likes: shouldLike ? comment.likes + 1 : comment.likes - 1,
            })),
          };
        })
      );

      const res = shouldLike
        ? await api.like(targetId, targetType)
        : await api.unlike(targetId, targetType);

      if (!res.error) return;

      // Revert on error
      setPosts(prev =>
        prev.map(post => {
          if (targetType === LikeTargetType.Post) {
            if (post.id !== targetId) return post;
            return {
              ...post,
              isLiked: currentLiked,
              likeCount: currentLiked ? post.likeCount + 1 : post.likeCount - 1,
            };
          }

          return {
            ...post,
            comments: updateCommentTree(post.comments ?? [], targetId, comment => ({
              ...comment,
              isLiked: currentLiked,
              likes: currentLiked ? comment.likes + 1 : comment.likes - 1,
            })),
          };
        })
      );
    },
    [posts]
  );


  const addComment = useCallback(
    async (postId: string, content: string, parentCommentId?: string) => {
      const { data, error: apiError } = await api.addComment(postId, content, parentCommentId);

      if (!apiError && data) {
        setPosts(prev =>
          prev.map(post => {
            if (post.id !== postId) return post;

            const normalized = normalizeComment(data, currentUser);

            if (!parentCommentId) {
              return { ...post, comments: [normalized, ...(post.comments ?? [])] };
            }

            return {
              ...post,
              comments: insertReply(post.comments ?? [], parentCommentId, normalized),
            };
          })
        );
      }

      return { data, error: apiError };
    },
    [currentUser]
  );

  return {
    posts,
    filter,
    isLoading,
    isRefreshing,
    error,
    fetchPosts,
    refreshFeed,
    likeTarget,
    addComment,
    setFilter,
  };
}
