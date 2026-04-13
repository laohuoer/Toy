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
  /**
   * 可选的 .glb/.gltf 文件路径（相对于 public/，不含 basePath 前缀）。
   * 示例：'/models/badge_woody.glb'
   * 若不填，Badge3DViewer 自动降级为程序生成的几何体。
   */
  modelUrl?: string;
  /**
   * 自定义徽章正面图片，叠加在 3D 徽章体之上（搪瓷徽章效果）。
   *
   * ── 三种使用方式 ──────────────────────────────────────────────────
   *
   * 方式一（最简单，无需改代码）
   *   直接替换 public/images/badges/{badge.id}.png
   *   支持任意 PNG/JPG/WebP，建议正方形、背景透明，≥128×128
   *   此字段留空即可，Badge3DViewer 会自动按约定路径加载
   *
   * 方式二（代码指定相对路径）
   *   imageUrl: '/images/custom/woody_custom.png'
   *   文件放在 public/ 下任意位置，路径以 / 开头
   *
   * 方式三（外部 URL）
   *   imageUrl: 'https://example.com/my-badge-face.png'
   *   直接加载远程图片（注意目标服务器须允许 CORS）
   *
   * 若此字段为空，系统自动尝试 /images/badges/{badge.id}.png，
   * 两者都找不到时徽章仍正常显示（纯色 3D 体）。
   * ────────────────────────────────────────────────────────────────
   */
  imageUrl?: string;

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
