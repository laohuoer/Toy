import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  User,
  UserBadge,
  FridgeDoor,
  FridgePlacement,
  GachaRecord,
  CheckinLog,
  GameState,
} from './types';
import {
  singlePull,
  tenPull,
  PullResult,
  SINGLE_PULL_COST,
  TEN_PULL_COST,
  canCheckinToday,
  getCheckinReward,
} from './gacha';
import { BADGES } from './badges';

// ── Initial State ─────────────────────────────────────────────────
const createInitialUser = (): User => ({
  id: `user_${Date.now()}`,
  username: '冰箱达人',
  email: '',
  avatar: '🧊',
  coins: 1600, // Start with enough for 10 pulls
  fragments: 0,
  level: 1,
  exp: 0,
  joinedAt: new Date().toISOString(),
  lastCheckin: null,
  checkinStreak: 0,
  totalCheckins: 0,
  achievements: [],
});

const createInitialFridgeDoor = (): FridgeDoor => ({
  placements: [],
  maxSlots: 12,
});

interface GameStore extends GameState {
  // Gacha actions
  pullSingle: () => PullResult | null;
  pullTen: () => PullResult[] | null;
  addFragment: (amount: number) => void;

  // Fridge door actions
  addBadgeToFridge: (badgeId: string, x: number, y: number) => void;
  removeBadgeFromFridge: (badgeId: string) => void;
  updateBadgePlacement: (badgeId: string, updates: Partial<FridgePlacement>) => void;
  clearFridge: () => void;

  // User actions
  updateUsername: (name: string) => void;
  updateAvatar: (avatar: string) => void;
  checkin: () => { success: boolean; coins: number; streak: number } | null;

  // Achievement
  unlockAchievement: (id: string) => void;

  // Utility
  getBadgeCount: (badgeId: string) => number;
  getOwnedBadgeIds: () => string[];
  isOnFridge: (badgeId: string) => boolean;
  hasBadge: (badgeId: string) => boolean;
  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────
      user: createInitialUser(),
      userBadges: [],
      fridgeDoor: createInitialFridgeDoor(),
      gachaRecords: [],
      pityCount: 0,
      checkinLogs: [],
      unlockedAchievements: [],

      // ── Gacha ──────────────────────────────────────────────────
      pullSingle: () => {
        const { user, pityCount, userBadges } = get();
        if (user.coins < SINGLE_PULL_COST) return null;

        const ownedIds = userBadges.map((b) => b.badgeId);
        const result = singlePull(pityCount, ownedIds);

        set((state) => {
          const existing = state.userBadges.find(
            (b) => b.badgeId === result.badge.id
          );
          const updatedBadges = existing
            ? state.userBadges.map((b) =>
                b.badgeId === result.badge.id
                  ? { ...b, quantity: b.quantity + 1 }
                  : b
              )
            : [
                ...state.userBadges,
                {
                  badgeId: result.badge.id,
                  quantity: 1,
                  obtainedAt: new Date().toISOString(),
                  firstObtainedAt: new Date().toISOString(),
                },
              ];

          const newRecord: GachaRecord = {
            id: `record_${Date.now()}`,
            badgeId: result.badge.id,
            timestamp: new Date().toISOString(),
            pityCount: state.pityCount,
          };

          return {
            user: {
              ...state.user,
              coins: state.user.coins - SINGLE_PULL_COST,
              fragments: state.user.fragments + result.fragmentsGained,
            },
            userBadges: updatedBadges,
            pityCount: result.pityCountAfter,
            gachaRecords: [newRecord, ...state.gachaRecords].slice(0, 500),
          };
        });

        return result;
      },

      pullTen: () => {
        const { user, pityCount, userBadges } = get();
        if (user.coins < TEN_PULL_COST) return null;

        const ownedIds = userBadges.map((b) => b.badgeId);
        const results = tenPull(pityCount, ownedIds);

        set((state) => {
          let updatedBadges = [...state.userBadges];
          let totalFragments = state.user.fragments;

          results.forEach((result) => {
            totalFragments += result.fragmentsGained;
            const existing = updatedBadges.find(
              (b) => b.badgeId === result.badge.id
            );
            if (existing) {
              updatedBadges = updatedBadges.map((b) =>
                b.badgeId === result.badge.id
                  ? { ...b, quantity: b.quantity + 1 }
                  : b
              );
            } else {
              updatedBadges.push({
                badgeId: result.badge.id,
                quantity: 1,
                obtainedAt: new Date().toISOString(),
                firstObtainedAt: new Date().toISOString(),
              });
            }
          });

          const lastPity = results[results.length - 1].pityCountAfter;
          const newRecords: GachaRecord[] = results.map((r, i) => ({
            id: `record_${Date.now()}_${i}`,
            badgeId: r.badge.id,
            timestamp: new Date().toISOString(),
            pityCount: state.pityCount,
          }));

          return {
            user: {
              ...state.user,
              coins: state.user.coins - TEN_PULL_COST,
              fragments: totalFragments,
            },
            userBadges: updatedBadges,
            pityCount: lastPity,
            gachaRecords: [...newRecords, ...state.gachaRecords].slice(0, 500),
          };
        });

        return results;
      },

      addFragment: (amount) => {
        set((state) => ({
          user: { ...state.user, fragments: state.user.fragments + amount },
        }));
      },

      // ── Fridge Door ────────────────────────────────────────────
      addBadgeToFridge: (badgeId, x, y) => {
        set((state) => {
          if (state.fridgeDoor.placements.length >= state.fridgeDoor.maxSlots) return state;
          if (state.fridgeDoor.placements.some((p) => p.badgeId === badgeId)) return state;

          const maxZ = state.fridgeDoor.placements.reduce(
            (max, p) => Math.max(max, p.zIndex),
            0
          );

          return {
            fridgeDoor: {
              ...state.fridgeDoor,
              placements: [
                ...state.fridgeDoor.placements,
                {
                  badgeId,
                  x,
                  y,
                  rotation: (Math.random() - 0.5) * 20,
                  scale: 1,
                  zIndex: maxZ + 1,
                },
              ],
            },
          };
        });
      },

      removeBadgeFromFridge: (badgeId) => {
        set((state) => ({
          fridgeDoor: {
            ...state.fridgeDoor,
            placements: state.fridgeDoor.placements.filter(
              (p) => p.badgeId !== badgeId
            ),
          },
        }));
      },

      updateBadgePlacement: (badgeId, updates) => {
        set((state) => ({
          fridgeDoor: {
            ...state.fridgeDoor,
            placements: state.fridgeDoor.placements.map((p) =>
              p.badgeId === badgeId ? { ...p, ...updates } : p
            ),
          },
        }));
      },

      clearFridge: () => {
        set((state) => ({
          fridgeDoor: { ...state.fridgeDoor, placements: [] },
        }));
      },

      // ── User ───────────────────────────────────────────────────
      updateUsername: (name) => {
        set((state) => ({
          user: { ...state.user, username: name },
        }));
      },

      updateAvatar: (avatar) => {
        set((state) => ({
          user: { ...state.user, avatar },
        }));
      },

      checkin: () => {
        const { user } = get();
        if (!canCheckinToday(user.lastCheckin)) return null;

        const newStreak = user.lastCheckin
          ? (() => {
              const last = new Date(user.lastCheckin);
              const now = new Date();
              const diff = Math.floor(
                (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
              );
              return diff === 1 ? user.checkinStreak + 1 : 1;
            })()
          : 1;

        const coinsEarned = getCheckinReward(newStreak);

        const log: CheckinLog = {
          date: new Date().toISOString().split('T')[0],
          coins: coinsEarned,
          streak: newStreak,
        };

        set((state) => ({
          user: {
            ...state.user,
            coins: state.user.coins + coinsEarned,
            lastCheckin: new Date().toISOString(),
            checkinStreak: newStreak,
            totalCheckins: state.user.totalCheckins + 1,
          },
          checkinLogs: [log, ...state.checkinLogs].slice(0, 30),
        }));

        return { success: true, coins: coinsEarned, streak: newStreak };
      },

      unlockAchievement: (id) => {
        set((state) => {
          if (state.unlockedAchievements.includes(id)) return state;
          return {
            unlockedAchievements: [...state.unlockedAchievements, id],
            user: {
              ...state.user,
              achievements: [...state.user.achievements, id],
            },
          };
        });
      },

      // ── Utility ────────────────────────────────────────────────
      getBadgeCount: (badgeId) => {
        const badge = get().userBadges.find((b) => b.badgeId === badgeId);
        return badge?.quantity ?? 0;
      },

      getOwnedBadgeIds: () => {
        return get().userBadges.map((b) => b.badgeId);
      },

      isOnFridge: (badgeId) => {
        return get().fridgeDoor.placements.some((p) => p.badgeId === badgeId);
      },

      hasBadge: (badgeId) => {
        return get().userBadges.some(
          (b) => b.badgeId === badgeId && b.quantity > 0
        );
      },

      // ── Reset ──────────────────────────────────────────────────
      resetGame: () => {
        set({
          user: createInitialUser(),
          userBadges: [],
          fridgeDoor: createInitialFridgeDoor(),
          gachaRecords: [],
          pityCount: 0,
          checkinLogs: [],
          unlockedAchievements: [],
        });
      },
    }),
    {
      name: 'fridge-badge-game-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
    }
  )
);
