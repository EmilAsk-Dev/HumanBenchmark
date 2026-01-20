import { Link } from 'react-router-dom';
import { Play, Users, Flame } from 'lucide-react';
import { DailyTest, TEST_CONFIGS } from '@/types';
import { Button } from '@/components/ui/button';

interface DailyTestBannerProps {
  dailyTest: DailyTest | null;
}

export function DailyTestBanner({ dailyTest }: DailyTestBannerProps) {
  if (!dailyTest) return null;
  
  const config = TEST_CONFIGS[dailyTest.testType];
  
  if (dailyTest.isCompleted) {
    return (
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
            <span className="text-xl">✓</span>
          </div>
          <div>
            <div className="font-semibold text-foreground">Daily Challenge Complete!</div>
            <div className="text-sm text-muted-foreground">Come back tomorrow for a new challenge</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl gradient-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">Daily Challenge</div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span>{config.name}</span>
              <span>•</span>
              <Users className="h-3.5 w-3.5" />
              <span>{dailyTest.participantCount.toLocaleString()} players</span>
            </div>
          </div>
        </div>
        
        <Link to={`/tests/${dailyTest.testType}?daily=true`}>
          <Button 
            size="sm" 
            className="gap-2 bg-white text-foreground hover:bg-white/90 shadow-lg"
          >
            <Play className="h-4 w-4" />
            Play
          </Button>
        </Link>
      </div>
    </div>
  );
}
