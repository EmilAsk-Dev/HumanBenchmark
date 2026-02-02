import { AppLayout } from '@/components/layout/AppLayout';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { TEST_CONFIGS, TestType, TimeFilter } from '@/types';
import { cn } from '@/lib/utils';

const testTypes: TestType[] = ['reaction', 'chimpTest', 'typing', 'sequenceTest'];
const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'all', label: 'All Time' },
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

        {entries && <div className="space-y-2">
          {entries.entries.map((entry, index) => (
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
                {entry.rank}
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">{entry.userName}</div>
                <div className="font-bold text-foreground">{entry.bestScore} {TEST_CONFIGS[testType].unit}</div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </AppLayout>
  );
}
