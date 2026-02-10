import { AppLayout } from '@/components/layout/AppLayout';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { TEST_CONFIGS, TestType, TimeFilter } from '@/types';
import { cn } from '@/lib/utils';

const testTypes: TestType[] = ['reaction', 'chimp', 'typing', 'sequence'];
const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
  { value: 'allTime', label: 'All Time' },
];

export default function Leaderboards() {
  const { entries, testType, timeFilter, fetchLeaderboard, isLoading, error } = useLeaderboard();
  return (
    <AppLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Leaderboards</h1>

        {/* Test type selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {testTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => fetchLeaderboard(type, timeFilter)}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer select-none',
                testType === type
                  ? 'gradient-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {TEST_CONFIGS[type].name}
            </button>
          ))}
        </div>

        {/* Time filter */}
        <div className="flex gap-2 mb-6">
          {timeFilters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => fetchLeaderboard(testType, value)}
              disabled={isLoading}

              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none',
                timeFilter === value
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
            </div>
          </div>
        )}

        {/* Leaderboard list */}
        {!isLoading && (

          <div className="space-y-2">
            {error && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {error}
              </div>
            )}

            {entries && entries.entries.length === 0 && !error && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                No results for this timeframe yet. Try another filter.
              </div>
            )}

            {entries && entries.entries.length > 0 && entries.entries.map((entry, index) => (
              <div
                key={entry.userId}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border border-border bg-card',
                  index < 3 && 'border-primary/30'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  index === 0 && 'bg-yellow-500 text-yellow-950',
                  index === 1 && 'bg-gray-300 text-gray-700',
                  index === 2 && 'bg-orange-400 text-orange-950',
                  index > 2 && 'bg-muted text-muted-foreground'
                )}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : entry.rank}
                </div>

                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full bg-muted object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.src.endsWith("/avatars/avatar-1.png")) img.src = "/avatars/avatar-1.png";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                    {(entry.userName?.trim()?.[0] ?? "?").toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{entry.userName}</div>
                  <div className="text-xs text-muted-foreground">@{entry.userName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{entry.bestScore} {TEST_CONFIGS[testType]?.unit}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
