import type { Chat } from '@google/genai';

export type AIPersona = 'School Student' | 'College Student' | 'Working Professional';
export type UserProfession = 'School Student' | 'College Student' | 'Employee';

export interface UserProfile {
  name: string;
  profession: UserProfession;
  girlfriendName: string;
  birthday?: string; // YYYY-MM-DD
  persona: AIPersona;
  relationshipStartDate: string;
  memories?: string[];
  avatarUrl?: string;
}

export type MessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: 'pending' | 'sent' | 'error';
}

export enum Mood {
  LOVING = 'loving and affectionate',
  FLIRTY = 'flirty and playful',
  HAPPY = 'happy and cheerful',
  SAD = 'sad and feeling down',
  ANGRY = 'angry and upset',
  NEUTRAL = 'neutral',
  HORNY = 'horny and desiring affection',
  NEEDY = 'feeling sensitive and needs pampering and cuddles',
  NERVOUS = 'a bit nervous and shy',
  AWKWARD = 'a little awkward but curious',
  ATTITUDE = 'playfully showing some attitude',
  SOFT = 'soft, gentle, and caring',
}

export enum RelationshipStatus {
  UNKNOWN = 'Unknown',
  ACQUAINTANCE = 'Acquaintance',
  FRIEND = 'Friend',
  CLOSE_FRIEND = 'Close Friend',
  CRUSH = 'Crush',
  GIRLFRIEND = 'Girlfriend',
}

export interface ChatSession {
  chat: Chat;
  history: ChatMessage[];
}

export type DateScenarioType = 'movie' | 'walk' | 'dinner' | 'stargazing';

export interface DateScenario {
  type: DateScenarioType;
  title: string;
  description: string;
  backgroundImage: string;
}
