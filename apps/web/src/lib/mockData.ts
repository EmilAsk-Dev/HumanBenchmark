import { User, Post, TestRun, LeaderboardEntry, TestStats, Badge, DailyTest, TestType } from '@/types';

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'speedster',
    displayName: 'Alex Speed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    createdAt: new Date('2024-01-15'),
    streak: 12,
    totalSessions: 245,
  },
  {
    id: '2',
    username: 'brainmaster',
    displayName: 'Emma Brain',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    createdAt: new Date('2024-02-20'),
    streak: 7,
    totalSessions: 156,
  },
  {
    id: '3',
    username: 'typingking',
    displayName: 'Marcus Type',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    createdAt: new Date('2024-03-10'),
    streak: 23,
    totalSessions: 312,
  },
  {
    id: '4',
    username: 'memoryqueen',
    displayName: 'Sofia Memory',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    createdAt: new Date('2024-01-05'),
    streak: 5,
    totalSessions: 89,
  },
  {
    id: '5',
    username: 'reflexgod',
    displayName: 'Jake Reflex',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jake',
    createdAt: new Date('2024-04-01'),
    streak: 31,
    totalSessions: 420,
  },
];

export const currentUser: User = mockUsers[0];

// Mock test runs
export const mockTestRuns: TestRun[] = [
  {
    id: 'tr1',
    userId: '1',
    testType: 'reaction',
    score: 187,
    percentile: 88,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 'tr2',
    userId: '2',
    testType: 'chimp',
    score: 12,
    percentile: 92,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'tr3',
    userId: '3',
    testType: 'typing',
    score: 98,
    percentile: 95,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: 'tr4',
    userId: '4',
    testType: 'sequence',
    score: 15,
    percentile: 85,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: 'tr5',
    userId: '5',
    testType: 'reaction',
    score: 156,
    percentile: 96,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
];

// Mock posts (feed items)
export const mockPosts: Post[] = mockTestRuns.map((run, index) => ({
  id: `post-${run.id}`,
  user: mockUsers.find(u => u.id === run.userId) || mockUsers[0],
  testRun: run,
  createdAt: run.createdAt,
  likes: Math.floor(Math.random() * 50) + 5,
  comments: [],
  isLiked: index % 3 === 0,
}));

// Mock leaderboard
export const mockLeaderboard: Record<TestType, LeaderboardEntry[]> = {
  reaction: mockUsers.map((user, index) => ({
    rank: index + 1,
    user,
    score: 150 + index * 15,
    percentile: 99 - index * 3,
    testType: 'reaction' as TestType,
  })),
  chimp: mockUsers.map((user, index) => ({
    rank: index + 1,
    user,
    score: 15 - index,
    percentile: 99 - index * 3,
    testType: 'chimp' as TestType,
  })),
  typing: mockUsers.map((user, index) => ({
    rank: index + 1,
    user,
    score: 120 - index * 10,
    percentile: 99 - index * 3,
    testType: 'typing' as TestType,
  })),
  sequence: mockUsers.map((user, index) => ({
    rank: index + 1,
    user,
    score: 18 - index,
    percentile: 99 - index * 3,
    testType: 'sequence' as TestType,
  })),
};

// Mock stats for current user
export const mockTestStats: TestStats[] = [
  {
    testType: 'reaction',
    personalBest: 167,
    median: 195,
    lastScore: 187,
    percentile: 88,
    totalAttempts: 45,
    history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      score: 180 + Math.floor(Math.random() * 40),
    })),
  },
  {
    testType: 'chimp',
    personalBest: 14,
    median: 10,
    lastScore: 12,
    percentile: 92,
    totalAttempts: 32,
    history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      score: 8 + Math.floor(Math.random() * 6),
    })),
  },
  {
    testType: 'typing',
    personalBest: 85,
    median: 72,
    lastScore: 78,
    percentile: 78,
    totalAttempts: 28,
    history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      score: 65 + Math.floor(Math.random() * 25),
    })),
  },
  {
    testType: 'sequence',
    personalBest: 16,
    median: 12,
    lastScore: 15,
    percentile: 85,
    totalAttempts: 21,
    history: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      score: 10 + Math.floor(Math.random() * 6),
    })),
  },
];

// Mock badges
export const mockBadges: Badge[] = [
  {
    id: 'b1',
    name: 'Speed Demon',
    description: 'Get under 200ms reaction time',
    icon: '⚡',
    unlockedAt: new Date('2024-06-15'),
    isUnlocked: true,
  },
  {
    id: 'b2',
    name: 'Chimp Champion',
    description: 'Reach level 12 in Chimp Test',
    icon: '🐵',
    unlockedAt: new Date('2024-07-01'),
    isUnlocked: true,
  },
  {
    id: 'b3',
    name: 'Typing Tornado',
    description: 'Type over 80 WPM',
    icon: '⌨️',
    isUnlocked: false,
  },
  {
    id: 'b4',
    name: 'Memory Master',
    description: 'Reach level 15 in Sequence Memory',
    icon: '🧠',
    unlockedAt: new Date('2024-08-10'),
    isUnlocked: true,
  },
  {
    id: 'b5',
    name: 'Streak King',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    isUnlocked: false,
  },
  {
    id: 'b6',
    name: 'Top 1%',
    description: 'Reach top 1% in any test',
    icon: '👑',
    isUnlocked: false,
  },
];

// Mock daily test
export const mockDailyTest: DailyTest = {
  testType: 'reaction',
  date: new Date(),
  participantCount: 1247,
  isCompleted: false,
};

// Typing test words
export const typingWords = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
];

export function generateTypingText(wordCount: number = 50): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(typingWords[Math.floor(Math.random() * typingWords.length)]);
  }
  return words.join(' ');
}
