'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import {
  BADGES,
  BADGE_MAP,
  SERIES_NAMES,
  SERIES_EMOJIS,
  RARITY_NAMES,
  RARITY_COLORS,
  RARITY_GLOW,
  SERIES_LIST,
} from '@/lib/badges';
import { BadgeSeries, Rarity } from '@/lib/types';
import { RarityBadge, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

type FilterRarity = Rarity | 'all';
type FilterSeries = BadgeSeries | 'all';
type FilterOwned = 'all' | 'owned' | 'unowned';

export default function BadgeCollection() {
  const { userBadges, hasBadge, getBadgeCount, addBadgeToFridge, isOnFridge, fridgeDoor } = useGameStore();
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [filterSeries, setFilterSeries] = useState<FilterSeries>('all');
  const [filterOwned, setFilterOwned] = useState<FilterOwned>('all');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  const ownedCount = userBadges.length;
  const totalCount = BADGES.length;

  const filteredBadges = useMemo(() => {
    return BADGES.filter((badge) => {
      if (filterRarity !== 'all' && badge.rarity !== filterRarity) return false;
      if (filterSeries !== 'all' && badge.series !== filterSeries) return false;
      const owned = hasBadge(badge.id);
      if (filterOwned === 'owned' && !owned) return false;
      if (filterOwned === 'unowned' && owned) return false;
      return true;
    });
  }, [filterRarity, filterSeries, filterOwned, userBadges]);

  const selectedBadgeData = selectedBadge ? BADGE_MAP[selectedBadge] : null;
  const selectedUserBadge = selectedBadge
    ? userBadges.find((b) => b.badgeId === selectedBadge)
    : null;

  const completedSeries = SERIES_LIST.filter((series) =>
    BADGES.filter((b) => b.series === series).every((b) => hasBadge(b.id))
  );

  const handleAddToFridge = () => {
    if (!selectedBadge) return;
    if (isOnFridge(selectedBadge)) return;
    if (fridgeDoor.placements.length >= fridgeDoor.maxSlots) return;
    addBadgeToFridge(selectedBadge, 20 + Math.random() * 60, 20 + Math.random() * 60);
    setSelectedBadge(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">📖 徽章图鉴</h1>
          <span className="text-sm text-gray-400">
            <span className="text-yellow-400 font-bold">{ownedCount}</span>/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${(ownedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* Completed series */}
        {completedSeries.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {completedSeries.map((s) => (
              <span
                key={s}
                className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded-full px-2 py-0.5 flex items-center gap-1"
              >
                <span>{SERIES_EMOJIS[s]}</span>
                <span>{SERIES_NAMES[s]} 已集齐 ✓</span>
              </span>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          {/* Rarity filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['all', 'common', 'rare', 'epic', 'legendary'] as FilterRarity[]).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRarity(r)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  filterRarity === r
                    ? r === 'all'
                      ? 'bg-white/20 text-white border-white/40'
                      : 'border-opacity-60 font-bold'
                    : 'bg-gray-800/60 text-gray-400 border-gray-700'
                )}
                style={
                  filterRarity === r && r !== 'all'
                    ? {
                        backgroundColor: `${RARITY_COLORS[r]}20`,
                        color: RARITY_COLORS[r],
                        borderColor: `${RARITY_COLORS[r]}60`,
                      }
                    : undefined
                }
              >
                {r === 'all' ? '全部' : RARITY_NAMES[r]}
              </button>
            ))}
          </div>

          {/* Series + owned filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterOwned(filterOwned === 'owned' ? 'all' : 'owned')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                filterOwned === 'owned'
                  ? 'bg-green-500/20 text-green-400 border-green-500/40'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700'
              )}
            >
              ✓ 已拥有
            </button>
            <button
              onClick={() => setFilterOwned(filterOwned === 'unowned' ? 'all' : 'unowned')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                filterOwned === 'unowned'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700'
              )}
            >
              ? 未拥有
            </button>
            {SERIES_LIST.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeries(filterSeries === s ? 'all' : s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  filterSeries === s
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-gray-800/60 text-gray-400 border-gray-700'
                )}
              >
                {SERIES_EMOJIS[s]} {SERIES_NAMES[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        <div className="grid grid-cols-4 gap-3">
          {filteredBadges.map((badge) => {
            const owned = hasBadge(badge.id);
            const count = getBadgeCount(badge.id);
            const onFridge = isOnFridge(badge.id);

            return (
              <button
                key={badge.id}
                onClick={() => owned && setSelectedBadge(badge.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all',
                  owned
                    ? 'bg-gray-800/80 hover:bg-gray-700/80 cursor-pointer active:scale-95'
                    : 'bg-gray-900/60 cursor-default opacity-60'
                )}
              >
                {/* Badge icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={
                    owned
                      ? {
                          background: badge.bgGradient,
                          boxShadow: `0 0 10px ${RARITY_GLOW[badge.rarity]}`,
                          border: `2px solid ${RARITY_COLORS[badge.rarity]}60`,
                        }
                      : {
                          background: 'linear-gradient(135deg, #374151, #1f2937)',
                          border: '2px solid #374151',
                          filter: 'grayscale(100%)',
                        }
                  }
                >
                  {owned ? badge.emoji : '❓'}
                </div>

                {/* Name */}
                <span className={cn('text-xs font-medium text-center leading-tight line-clamp-2', owned ? 'text-white' : 'text-gray-600')}>
                  {owned ? badge.name : '???'}
                </span>

                {/* Rarity dot */}
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: owned ? RARITY_COLORS[badge.rarity] : '#374151' }}
                />

                {/* Count badge */}
                {owned && count > 1 && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </div>
                )}

                {/* On fridge indicator */}
                {onFridge && (
                  <div className="absolute top-1 left-1 text-xs">📌</div>
                )}
              </button>
            );
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>没有符合条件的徽章</p>
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <Modal
        isOpen={!!selectedBadgeData}
        onClose={() => setSelectedBadge(null)}
        size="md"
      >
        {selectedBadgeData && (
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{
                background: selectedBadgeData.bgGradient,
                boxShadow: `0 0 30px ${RARITY_GLOW[selectedBadgeData.rarity]}`,
                border: `3px solid ${RARITY_COLORS[selectedBadgeData.rarity]}80`,
              }}
            >
              {selectedBadgeData.emoji}
            </div>

            <RarityBadge rarity={selectedBadgeData.rarity} size="md" className="mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{selectedBadgeData.name}</h3>
            <p className="text-sm text-gray-400 mb-3">{selectedBadgeData.description}</p>

            <div className="bg-gray-800/60 rounded-xl p-3 text-left mb-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">系列</span>
                <span className="text-white">{SERIES_EMOJIS[selectedBadgeData.series]} {SERIES_NAMES[selectedBadgeData.series]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">拥有数量</span>
                <span className="text-white font-bold">{getBadgeCount(selectedBadgeData.id)}</span>
              </div>
              {selectedUserBadge && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">首次获得</span>
                  <span className="text-white text-xs">
                    {new Date(selectedUserBadge.firstObtainedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">获得途径</span>
                <span className="text-white text-xs">{selectedBadgeData.obtainMethod}</span>
              </div>
            </div>

            <p className="text-gray-500 text-xs italic mb-4 px-2 leading-relaxed">
              「{selectedBadgeData.storyText}」
            </p>

            {isOnFridge(selectedBadgeData.id) ? (
              <p className="text-green-400 text-sm mb-3">📌 已展示在冰箱门上</p>
            ) : fridgeDoor.placements.length >= fridgeDoor.maxSlots ? (
              <p className="text-red-400 text-sm mb-3">冰箱门已满（{fridgeDoor.maxSlots}枚）</p>
            ) : (
              <button
                onClick={handleAddToFridge}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                📌 贴到冰箱门
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
