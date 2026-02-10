import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/AuthProvider";

export default function Feed() {
  const { posts, filter, setFilter, likeTarget, addComment, deleteComment, deletePost, updatePostCaption } = useFeed();
  const { user } = useAuth();

  const [hideMyPosts, setHideMyPosts] = useState<boolean>(() => {
    try {
      return localStorage.getItem("feed:hideMyPosts") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("feed:hideMyPosts", hideMyPosts ? "1" : "0");
    } catch {
      // ignore
    }
  }, [hideMyPosts]);

  const visiblePosts = useMemo(() => {
    if (!hideMyPosts) return posts;
    if (!user?.id) return posts;
    return posts.filter((p) => p.user?.id !== user.id);
  }, [posts, hideMyPosts, user?.id]);

  return (
    <AppLayout>
      {/* Side padding only (no max-width container) */}
      <div className="w-full px-4 sm:px-6">
        <div className="pt-4">
          <FeedFilters
            currentFilter={filter}
            onFilterChange={setFilter}
            hideMyPosts={hideMyPosts}
            onHideMyPostsChange={setHideMyPosts}
          />
        </div>

        <div className="space-y-4 pb-10 pt-4">
          {visiblePosts.map((post, index) => (
            <FeedCard
              key={post.id}
              post={post}
              onLike={likeTarget}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
              onDeletePost={deletePost}
              onUpdateCaption={updatePostCaption}
              currentUserId={user?.id}
              index={index}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
