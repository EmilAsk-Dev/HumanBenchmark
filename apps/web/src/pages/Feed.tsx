// Feed.tsx
import { useMemo, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { DailyTestBanner } from "@/components/feed/DailyTestBanner";
import { useFeed } from "@/hooks/useFeed";
import { useTests } from "@/hooks/useTests";
import { useAuth } from "@/hooks/AuthProvider";

export default function Feed() {
  const { posts, filter, setFilter, likeTarget, addComment } = useFeed();
  const { dailyTest } = useTests();
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

    }
  }, [hideMyPosts]);

  const visiblePosts = useMemo(() => {
    if (!hideMyPosts) return posts;
    if (!user?.id) return posts;
    return posts.filter(p => p.user?.id !== user.id);
  }, [posts, hideMyPosts, user?.id]);

  return (
    <AppLayout>
      {dailyTest && <DailyTestBanner dailyTest={dailyTest} />}

      <FeedFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        hideMyPosts={hideMyPosts}
        onHideMyPostsChange={setHideMyPosts}
      />

      <div className="divide-y divide-border">
        {visiblePosts.map((post, index) => (
          <FeedCard
            key={post.id}
            post={post}
            onLike={likeTarget}
            onAddComment={addComment}
            index={index}
          />
        ))}
      </div>
    </AppLayout>
  );
}
