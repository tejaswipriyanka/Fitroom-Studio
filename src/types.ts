export type UndertoneType = 'warm' | 'cool' | 'neutral' | 'olive';

export type WeatherCondition =
  | 'sunny_warm'
  | 'mild_breeze'
  | 'rainy_humid'
  | 'cold_layered'
  | 'indoor_ac';

export type FormalityLevel =
  | 'casual'
  | 'smart_casual'
  | 'business_casual'
  | 'formal_evening';

export type ClosetCategory =
  | 'tops'
  | 'bottoms'
  | 'outerwear'
  | 'footwear'
  | 'accessories'
  | 'full_outfit';

export type PermissionStateSetting = 'granted' | 'denied' | 'prompt';

export interface AuthUser {
  uid: string;
  name: string;
  avatarInitials: string;
  isGuest: boolean;
  joinedAt: string;
}

export interface FitroomSettings {
  usageLimit: number;
  usageUsed: number;
  theme: 'white' | 'black';
  keepChatHistory: boolean;
  cameraPermission: PermissionStateSetting;
  photosPermission: PermissionStateSetting;
  micPermission: PermissionStateSetting;
}

export interface GuestProfile {
  name: string;
  status: string;
  avatarInitials: string;
  isGuest: boolean;
  joinedAt: string;
  heightCm?: number;
  skinToneMonk?: number;
  undertone?: UndertoneType;
  bodyShape?: string;
  colorPreferences?: string;
  clothingPreferences?: string;
  preferencesReviewed?: boolean;
}

export interface ExpertStylist {
  id: string;
  name: string;
  role: string;
  specialty: string;
  avatar: string;
  bio: string;
  tone: string;
  signatureAdvice: string;
  suggestedPrompts: string[];
}

export interface OccasionOption {
  id: string;
  label: string;
  description: string;
  defaultFormality: FormalityLevel;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  occasion?: string;
  expertName?: string;
  expertAvatar?: string;
  outfitName?: string;
  imageUrl?: string;
  generatedOutfitImageUrl?: string;
  hasAudio?: boolean;
  isGeneratingImage?: boolean;
  suggestedFormality?: FormalityLevel;
  isOutOfScope?: boolean;
}

export interface SavedChatSession {
  id: string;
  expertId: string;
  expertName: string;
  occasion: string;
  previewTitle: string;
  lastMessageSnippet: string;
  timestamp: string;
  messageCount: number;
}

export interface ClosetItem {
  id: string;
  name: string;
  category: ClosetCategory;
  colorName: string;
  colorHex: string;
  fabric?: string;
  season?: string;
  formality: FormalityLevel;
  imageUrl?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  preferredOccasion: string;
  heightCm?: number;
  defaultUndertone?: UndertoneType;
  defaultMonkSkinTone?: number;
  bodyShape?: string;
  colorPreferences?: string;
  clothingPreferences?: string;
  avatarInitials: string;
  joinedDate: string;
}

export interface AppSettings {
  storeHistory: boolean;
  theme: 'light' | 'dark';
  lightingSensitivity: 'standard' | 'warm_indoor' | 'daylight';
  developerMode: boolean;
}
