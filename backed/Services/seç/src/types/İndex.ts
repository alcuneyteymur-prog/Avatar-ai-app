export interface User {
  id: string;
  email: string;
  name: string;
  subscription: {
    type: 'free' | 'premium' | 'family';
    expiresAt?: string;
  };
  usage: {
    chatMinutes: number;
    chatLimit: number;
  };
}

export interface Avatar {
  _id: string;
  userId: string;
  name: string;
  rpmAvatarUrl: string;
  elevenLabsVoiceId: string;
  personalityPrompt: string;
  language: string;
  autoDetectLanguage: boolean;
  memory: Array<{
    role: 'user' | 'assistant';
    content: string;
    language?: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface Room {
  _id: string;
  hostId: string;
  avatarId: string;
  name: string;
  inviteCode: string;
  participants: Array<{
    userId: string;
    joinedAt: string;
  }>;
  maxParticipants: number;
  isActive: boolean;
  gameType: 'none' | 'tavla' | 'okey';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  language: string;
  languageName: string;
  wakeWordDetected: boolean;
  avatarName?: string;
  wakeWordRequired?: boolean;
}
