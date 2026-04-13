// Core type definitions for the Fridge Badge Game

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BadgeSeries =
  | 'toy_story'
  | 'monsters_inc'
  | 'finding_nemo'
  | 'incredibles'
  | 'cars'
  | 'ratatouille';

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  series: BadgeSeries;
  emoji: string;
  color: string;
  bgGradient: string;
  dropRate: number; // probability 0-1
  storyText: string;
  obtainMethod: string;
  modelType: 'circle' | 'hexagon' | 'star' | 'shield' | 'diamond';
}

export interface UserBadge {
  badgeId: string;
  quantity: number;
  obtainedAt: string; // ISO date string
  firstObtainedAt: string; // ISO date string
}

export interface FridgePlacement {
  badgeId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  scale: number; // 0.5-1.5
  zIndex: number;
}

export interface FridgeDoor {
  placements: FridgePlacement[];
  maxSlots: number;
}

export interface GachaRecord {
  id: string;
  badgeId: string;
  timestamp: string;
  pityCount: number; // pulls since last legendary
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number; // coins
  condition: (stats: GameStats) => boolean;
  unlocked?: boolean;
  unlockedAt?: string;
}

export interface GameStats {
  totalPulls: number;
  totalBadges: number;
  uniqueBadges: number;
  legendaryCount: number;
  epicCount: number;
  rareCount: number;
  commonCount: number;
  completedSeries: BadgeSeries[];
  consecutiveCheckins: number;
  totalCheckins: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  coins: number;
  fragments: number;
  level: number;
  exp: number;
  joinedAt: string;
  lastCheckin: string | null;
  checkinStreak: number;
  totalCheckins: number;
  achievements: string[]; // achievement ids
}

export interface CheckinLog {
  date: string; // YYYY-MM-DD
  coins: number;
  streak: number;
}

export interface GameState {
  user: User;
  userBadges: UserBadge[];
  fridgeDoor: FridgeDoor;
  gachaRecords: GachaRecord[];
  pityCount: number; // current pity counter
  checkinLogs: CheckinLog[];
  unlockedAchievements: string[];
}
