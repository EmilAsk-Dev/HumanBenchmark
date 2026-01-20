export type TestType = 'reaction' | 'chimp' | 'typing' | 'sequence';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
  streak: number;
  totalSessions: number;
}

export interface TestRun {
  id: string;
  userId: string;
  testType: TestType;
  score: number;
  percentile: number;
  createdAt: Date;
  details?: Record<string, unknown>;
}

export interface Post {
  id: string;
  user: User;
  testRun: TestRun;
  createdAt: Date;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  createdAt: Date;
  likes: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  percentile: number;
  testType: TestType;
}

export interface TestStats {
  testType: TestType;
  personalBest: number;
  median: number;
  lastScore: number;
  percentile: number;
  totalAttempts: number;
  history: { date: Date; score: number }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

export interface DailyTest {
  testType: TestType;
  date: Date;
  participantCount: number;
  isCompleted: boolean;
}

export type TimeFilter = 'daily' | 'weekly' | 'allTime';
export type FeedFilter = 'friends' | 'global' | 'trending';

export interface TestConfig {
  type: TestType;
  name: string;
  description: string;
  icon: string;
  color: string;
  unit: string;
  higherIsBetter: boolean;
}

export const TEST_CONFIGS: Record<TestType, TestConfig> = {
  reaction: {
    type: 'reaction',
    name: 'Reaction Time',
    description: 'Test your reflexes. Click as fast as you can when the color changes.',
    icon: 'Zap',
    color: 'hsl(142 71% 45%)',
    unit: 'ms',
    higherIsBetter: false,
  },
  chimp: {
    type: 'chimp',
    name: 'Chimp Test',
    description: 'Are you smarter than a chimpanzee? Remember the positions of the numbers.',
    icon: 'Brain',
    color: 'hsl(38 92% 50%)',
    unit: 'level',
    higherIsBetter: true,
  },
  typing: {
    type: 'typing',
    name: 'Typing Speed',
    description: 'How fast can you type? Test your words per minute.',
    icon: 'Keyboard',
    color: 'hsl(188 94% 43%)',
    unit: 'WPM',
    higherIsBetter: true,
  },
  sequence: {
    type: 'sequence',
    name: 'Sequence Memory',
    description: 'Remember an increasingly long pattern of button presses.',
    icon: 'Grid3x3',
    color: 'hsl(270 60% 55%)',
    unit: 'level',
    higherIsBetter: true,
  },
};
