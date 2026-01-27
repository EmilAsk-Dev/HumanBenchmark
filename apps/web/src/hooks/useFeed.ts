import { useState, useCallback, useEffect } from 'react';
import { Post, FeedFilter } from '@/types';
import { api } from '@/lib/api';
import { normalizePosts } from '@/lib/normalize';

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('global');
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

  // Initial fetch
  useEffect(() => {
    fetchPosts(filter);
  }, []);

  const refreshFeed = useCallback(async () => {
    setIsRefreshing(true);
    const { data } = await api.getPosts();
    setPosts(data || []);
    setIsRefreshing(false);
  }, [filter]);

  const likePost = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likeCount - 1 : post.likeCount + 1 }
        : post
    ));

    const { error } = await api.likePost(postId);

    if (error) {
      // Revert on error
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likeCount - 1 : post.likeCount + 1 }
          : post
      ));
    }
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    const { data, error } = await api.addComment(postId, content);

    if (!error && data) {
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, data] }
          : post
      ));
    }

    return { data, error };
  }, []);

  return {
    posts,
    filter,
    isLoading,
    isRefreshing,
    error,
    fetchPosts,
    refreshFeed,
    likePost,
    addComment,
    setFilter,
  };
}
