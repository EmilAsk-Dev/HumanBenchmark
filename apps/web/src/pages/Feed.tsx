import { AppLayout } from '@/components/layout/AppLayout';
import { FeedCard } from '@/components/feed/FeedCard';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { DailyTestBanner } from '@/components/feed/DailyTestBanner';
import { useFeed } from '@/hooks/useFeed';
import { useTests } from '@/hooks/useTests';

export default function Feed() {
  const { posts, filter, setFilter, likePost, addComment } = useFeed();
  const { dailyTest } = useTests();

  return (
    <AppLayout>
      {dailyTest && <DailyTestBanner dailyTest={dailyTest} />}
      <FeedFilters currentFilter={filter} onFilterChange={setFilter} />
      <div className="divide-y divide-border">
        {posts.map((post, index) => (
          <FeedCard
            key={post.id}
            post={post}
            onLike={likePost}
            onAddComment={addComment}
            index={index}
          />
        ))}
      </div>
    </AppLayout>
  );
}
