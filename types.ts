export interface HeadshotStyle {
  id: string;
  name: string;
  prompt: string;
  backgroundDescription: string;
  thumbnail: string;
}

export interface Scene {
  id:string;
  name: string;
  thumbnail: string;
}

export interface PortraitStyle {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
}

export interface InspirationCategory {
  id: string;
  name: string;
  prompts: string[];
}

export interface GeneratedInspiration {
  id: string;
  src: string;
  prompt: string;
}


export type View = 'landing' | 'headshot' | 'scene' | 'freestyle' | 'video' | 'history' | 'restore' | 'inspiration' | 'tutorials' | 'blender' | 'fullbody' | 'outfit' | 'pose' | 'backgroundswap' | 'faceswap' | 'stylizer' | 'morph' | 'outpainting' | 'animeConverter' | 'account' | 'settings' | 'community' | 'upscaler' | 'trainmodel' | 'texturegen' | 'realtimeCanvas' | 'canvasEditor' | 'flowstate';

export interface HistoryItem {
  id: string;
  imageUrl: string;
  type: 'headshot' | 'scene' | 'video' | 'restore' | 'freestyle' | 'blender' | 'fullbody' | 'outfit' | 'pose' | 'backgroundswap' | 'faceswap' | 'stylizer' | 'morph' | 'outpainting' | 'animeConverter';
  timestamp: number;
  isFavorite?: boolean;
  prompt?: string;
  details?: string;
  inputImages?: { url: string; label: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  token: string; // Thêm token để quản lý session
}

export interface CommunityPost {
  id: string;
  imageUrl: string;
  prompt: string;
  author: string;
  likes: number;
  type: HistoryItem['type'];
}