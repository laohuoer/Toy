import { Badge, GachaRecord, Rarity } from './types';
import { BADGES } from './badges';

// ── Constants ──────────────────────────────────────────────────────
export const SINGLE_PULL_COST = 1;
export const TEN_PULL_COST = 9; // 10% discount
export const PITY_THRESHOLD = 90; // guaranteed legendary after 90 pulls
export const SOFT_PITY_START = 74; // increased rate from pull 74
export const FRAGMENT_PER_DUPE = 10;
export const SYNTHESIS_COST: Record<Rarity, number> = {
  common: 30,
  rare: 80,
  epic: 200,
  legendary: 500,
};

// ── Weighted pool ──────────────────────────────────────────────────
const BASE_RATES: Record<Rarity, number> = {
  common: 0.6,
  rare: 0.3,
  epic: 0.09,
  legendary: 0.01,
};

function getRates(pityCount: number): Record<Rarity, number> {
  if (pityCount >= PITY_THRESHOLD) {
    return { common: 0, rare: 0, epic: 0, legendary: 1 };
  }
  if (pityCount >= SOFT_PITY_START) {
    const extra = (pityCount - SOFT_PITY_START + 1) * 0.06;
    const legendaryRate = Math.min(BASE_RATES.legendary + extra, 1);
    const remaining = 1 - legendaryRate;
    return {
      common: BASE_RATES.common * remaining,
      rare: BASE_RATES.rare * remaining,
      epic: BASE_RATES.epic * remaining,
      legendary: legendaryRate,
    };
  }
  return { ...BASE_RATES };
}

function pickRarity(pityCount: number): Rarity {
  const rates = getRates(pityCount);
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, rate] of Object.entries(rates) as [Rarity, number][]) {
    cumulative += rate;
    if (roll < cumulative) return rarity;
  }
  return 'common';
}

function pickBadgeByRarity(rarity: Rarity, excludeIds: string[] = []): Badge {
  const pool = BADGES.filter(
    (b) => b.rarity === rarity && !excludeIds.includes(b.id)
  );
  if (pool.length === 0) {
    const fallback = BADGES.filter((b) => b.rarity === rarity);
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  // Weighted by individual dropRate within rarity
  const totalWeight = pool.reduce((s, b) => s + b.dropRate, 0);
  let roll = Math.random() * totalWeight;
  for (const badge of pool) {
    roll -= badge.dropRate;
    if (roll <= 0) return badge;
  }
  return pool[pool.length - 1];
}

export interface PullResult {
  badge: Badge;
  isNew: boolean;
  pityCountAfter: number;
  fragmentsGained: number;
}

export function singlePull(
  pityCount: number,
  ownedBadgeIds: string[]
): PullResult {
  const rarity = pickRarity(pityCount);
  const badge = pickBadgeByRarity(rarity);
  const isNew = !ownedBadgeIds.includes(badge.id);
  const newPity = rarity === 'legendary' ? 0 : pityCount + 1;

  return {
    badge,
    isNew,
    pityCountAfter: newPity,
    fragmentsGained: isNew ? 0 : FRAGMENT_PER_DUPE,
  };
}

export function tenPull(
  pityCount: number,
  ownedBadgeIds: string[]
): PullResult[] {
  const results: PullResult[] = [];
  let currentPity = pityCount;

  for (let i = 0; i < 10; i++) {
    const result = singlePull(currentPity, ownedBadgeIds);
    results.push(result);
    currentPity = result.pityCountAfter;
    if (!result.isNew) {
      // Mark as owned for next pulls in this batch
    } else {
      ownedBadgeIds = [...ownedBadgeIds, result.badge.id];
    }
  }

  // Guarantee at least one rare or higher in 10-pull
  const hasRarePlus = results.some(
    (r) => r.badge.rarity === 'rare' ||
           r.badge.rarity === 'epic' ||
           r.badge.rarity === 'legendary'
  );
  if (!hasRarePlus) {
    const idx = Math.floor(Math.random() * 10);
    const rareBadge = pickBadgeByRarity('rare');
    const isNew = !ownedBadgeIds.includes(rareBadge.id);
    results[idx] = {
      badge: rareBadge,
      isNew,
      pityCountAfter: results[idx].pityCountAfter,
      fragmentsGained: isNew ? 0 : FRAGMENT_PER_DUPE,
    };
  }

  return results;
}

// ── Daily Check-in ────────────────────────────────────────────────
export const CHECKIN_REWARDS = [50, 60, 70, 80, 100, 120, 200]; // 7-day cycle
export const CHECKIN_STREAK_BONUS = [0, 0, 10, 20, 30, 50, 100];

export function getCheckinReward(streak: number): number {
  const dayIndex = (streak - 1) % 7;
  const base = CHECKIN_REWARDS[dayIndex];
  const bonus = streak >= 7 ? CHECKIN_STREAK_BONUS[6] : CHECKIN_STREAK_BONUS[streak - 1] || 0;
  return base + bonus;
}

export function canCheckinToday(lastCheckin: string | null): boolean {
  if (!lastCheckin) return true;
  const last = new Date(lastCheckin);
  const now = new Date();
  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth() ||
    last.getDate() !== now.getDate()
  );
}

// ── Fragment Synthesis ────────────────────────────────────────────
export function canSynthesize(rarity: Rarity, fragments: number): boolean {
  return fragments >= SYNTHESIS_COST[rarity];
}
