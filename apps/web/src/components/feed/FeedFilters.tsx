// FeedFilters.tsx
import { FeedFilter } from '@/types';
import { cn } from '@/lib/utils';

interface FeedFiltersProps {
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;

  hideMyPosts: boolean;
  onHideMyPostsChange: (value: boolean) => void;
}

const filters: { value: FeedFilter; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'friends', label: 'Friends' },
  { value: 'trending', label: 'Trending' },
];

export function FeedFilters({
  currentFilter,
  onFilterChange,
  hideMyPosts,
  onHideMyPostsChange,
}: FeedFiltersProps) {
  return (
    <div className="flex flex-col gap-3 p-4 border-b border-border bg-background">
      <div className="flex gap-2">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              currentFilter === value
                ? 'gradient-primary text-primary-foreground shadow-md glow-primary'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={hideMyPosts}
            onChange={(e) => onHideMyPostsChange(e.target.checked)}
          />
          Don’t show my posts
        </label>
      </div>


    </div>
  );
}
