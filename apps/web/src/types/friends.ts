export interface Friend {
  id: string;
  userName: string;
  avatar?: string;
  status: "online" | "offline" | "playing";
  lastSeen?: Date;
  currentGame?: string;
}

export interface FriendListItem {
  user: Friend;
  createdAt: string;
}




export interface FriendRequest {
  id: string;
  from: Friend;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  sharedScore?: SharedScore;
}

export interface SharedScore {
  testType: "reaction" | "chimp" | "typing" | "sequence";
  score: number;
  unit: string;
}

export interface Conversation {
  friend: Friend;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface FriendStats {
  testType: "reaction" | "chimp" | "typing" | "sequence";
  personalBest: number;
  totalAttempts: number;
}
