import { AppLayout } from '@/components/layout/AppLayout';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { TEST_CONFIGS, TestType, TimeFilter } from '@/types';
import { cn } from '@/lib/utils';

const testTypes: TestType[] = ['reaction', 'chimp', 'typing', 'sequence'];
const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'Week' },
  { value: 'allTime', label: 'All Time' },
];

export default function Leaderboards() {
  const { entries, testType, timeFilter, setTestType, setTimeFilter, fetchLeaderboard } = useLeaderboard();

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

        {/* Leaderboard list */}
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.user.id}
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
              <img src={entry.user.avatar} alt="" className="w-10 h-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">{entry.user.displayName}</div>
                <div className="text-xs text-muted-foreground">@{entry.user.username}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">{entry.score} {TEST_CONFIGS[testType].unit}</div>
                <div className="text-xs text-primary">Top {100 - entry.percentile}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
