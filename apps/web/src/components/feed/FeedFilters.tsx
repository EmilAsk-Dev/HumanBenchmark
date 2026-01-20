import { FeedFilter } from '@/types';
import { cn } from '@/lib/utils';

interface FeedFiltersProps {
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const filters: { value: FeedFilter; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'friends', label: 'Friends' },
  { value: 'trending', label: 'Trending' },
];

export function FeedFilters({ currentFilter, onFilterChange }: FeedFiltersProps) {
  return (
    <div className="flex gap-2 p-4 border-b border-border bg-background">
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
    </div>
  );
}
