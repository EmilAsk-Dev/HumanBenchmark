import { useState, useCallback, useEffect } from "react";
import { Post, FeedFilter, LikeTargetType } from "@/types";
import { api } from "@/lib/api";
import { normalizePosts } from "@/lib/normalize";

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("global");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (feedFilter: FeedFilter) => {
    setIsLoading(true);
    setError(null);

    // If your backend supports filter, pass it here: api.getFeed(feedFilter)
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

  /**
   * Toggle like for either a post or a comment.
   * - Like:   POST   /likes   { targetType, targetId }
   * - Unlike: DELETE /likes/{post|comment}/{targetId}
   */
  const likeTarget = useCallback(
    async (targetId: string, targetType: LikeTargetType) => {
      // Determine current liked state from current posts snapshot
      const currentLiked =
        targetType === LikeTargetType.Post
          ? posts.find(p => p.id === targetId)?.isLiked ?? false
          : posts.some(p => p.comments.some(c => c.id === targetId && c.isLiked));

      const shouldLike = !currentLiked;

      // Optimistic update
      setPosts(prev =>
        prev.map(post => {
          if (targetType === LikeTargetType.Post) {
            if (post.id !== targetId) return post;

            return {
              ...post,
              isLiked: shouldLike,
              likeCount: shouldLike ? post.likeCount + 1 : post.likeCount - 1,
            };
          }

          // Comment like
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id !== targetId) return comment;

              return {
                ...comment,
                isLiked: shouldLike,
                likes: shouldLike ? comment.likes + 1 : comment.likes - 1,
              };
            }),
          };
        })
      );

      // Call backend
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
            comments: post.comments.map(comment => {
              if (comment.id !== targetId) return comment;

              return {
                ...comment,
                isLiked: currentLiked,
                likes: currentLiked ? comment.likes + 1 : comment.likes - 1,
              };
            }),
          };
        })
      );
    },
    [posts]
  );

  const addComment = useCallback(async (postId: string, content: string) => {
    const { data, error: apiError } = await api.addComment(postId, content);

    if (!apiError && data) {
      // NOTE: If `data` is raw API comment (e.g. `text` not `content`),
      // normalize it before inserting, or re-fetch the post/comments.
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, comments: [...post.comments, data] } : post
        )
      );
    }

    return { data, error: apiError };
  }, []);

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
