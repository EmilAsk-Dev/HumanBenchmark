import {
  Friend,
  Conversation,
  Message,
  FriendRequest,
  FriendStats,
} from "@/types/friends";

export const mockFriends: Friend[] = [
  {
    id: "1",
    username: "speedster99",
    displayName: "Emma Swift",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    status: "online",
  },
  {
    id: "2",
    username: "brainiac42",
    displayName: "Marcus Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
    status: "playing",
    currentGame: "Chimp Test",
  },
  {
    id: "3",
    username: "typequeen",
    displayName: "Sofia Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
    status: "offline",
    lastSeen: new Date(Date.now() - 3600000),
  },
  {
    id: "4",
    username: "reflexmaster",
    displayName: "Jake Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jake",
    status: "online",
  },
  {
    id: "5",
    username: "memoryking",
    displayName: "Aisha Patel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
    status: "offline",
    lastSeen: new Date(Date.now() - 86400000),
  },
];

export const mockFriendStats: Record<string, FriendStats[]> = {
  "1": [
    { testType: "reaction", personalBest: 187, totalAttempts: 45 },
    { testType: "typing", personalBest: 112, totalAttempts: 32 },
    { testType: "chimp", personalBest: 12, totalAttempts: 28 },
    { testType: "sequence", personalBest: 9, totalAttempts: 15 },
  ],
  "2": [
    { testType: "reaction", personalBest: 203, totalAttempts: 38 },
    { testType: "chimp", personalBest: 14, totalAttempts: 56 },
    { testType: "typing", personalBest: 98, totalAttempts: 21 },
    { testType: "sequence", personalBest: 11, totalAttempts: 33 },
  ],
  "3": [
    { testType: "typing", personalBest: 134, totalAttempts: 89 },
    { testType: "reaction", personalBest: 195, totalAttempts: 42 },
    { testType: "chimp", personalBest: 10, totalAttempts: 18 },
    { testType: "sequence", personalBest: 8, totalAttempts: 12 },
  ],
  "4": [
    { testType: "reaction", personalBest: 156, totalAttempts: 120 },
    { testType: "typing", personalBest: 89, totalAttempts: 25 },
    { testType: "chimp", personalBest: 9, totalAttempts: 14 },
    { testType: "sequence", personalBest: 7, totalAttempts: 9 },
  ],
  "5": [
    { testType: "sequence", personalBest: 15, totalAttempts: 78 },
    { testType: "chimp", personalBest: 13, totalAttempts: 45 },
    { testType: "reaction", personalBest: 210, totalAttempts: 30 },
    { testType: "typing", personalBest: 76, totalAttempts: 18 },
  ],
};

export const mockSearchResults: Friend[] = [
  {
    id: "6",
    username: "newplayer123",
    displayName: "Alex Turner",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    status: "online",
  },
  {
    id: "7",
    username: "gamerpro",
    displayName: "Lisa Park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    status: "offline",
    lastSeen: new Date(Date.now() - 7200000),
  },
];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: "req1",
    from: {
      id: "8",
      username: "challenger2024",
      displayName: "Ryan Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryan",
      status: "online",
    },
    createdAt: new Date(Date.now() - 1800000),
  },
];

export const mockConversations: Conversation[] = [
  {
    friend: mockFriends[0],
    messages: [
      {
        id: "m1",
        senderId: "1",
        receiverId: "me",
        content: "Bra spelat! 🎮",
        createdAt: new Date(Date.now() - 300000),
        isRead: true,
      },
      {
        id: "m2",
        senderId: "me",
        receiverId: "1",
        content: "Tack! Ska vi köra en match?",
        createdAt: new Date(Date.now() - 240000),
        isRead: true,
      },
      {
        id: "m3",
        senderId: "1",
        receiverId: "me",
        content: "Absolut, jag är redo!",
        createdAt: new Date(Date.now() - 180000),
        isRead: false,
      },
    ],
    unreadCount: 1,
  },
  {
    friend: mockFriends[1],
    messages: [
      {
        id: "m4",
        senderId: "2",
        receiverId: "me",
        content: "Kolla mitt nya rekord i Chimp Test!",
        createdAt: new Date(Date.now() - 3600000),
        isRead: true,
      },
    ],
    unreadCount: 0,
  },
];
