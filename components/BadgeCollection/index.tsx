'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import { Badge, BadgeSeries, Rarity } from '@/lib/types';
import { RarityBadge, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

// Lazy-load the heavy Three.js viewer
const Badge3DViewer = dynamic(() => import('@/components/Badge3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-2xl">
      <div className="text-center">
        <div className="text-4xl animate-spin mb-2">🔮</div>
        <p className="text-gray-500 text-xs">3D 加载中…</p>
      </div>
    </div>
  ),
});

type FilterRarity = Rarity | 'all';
type FilterSeries = BadgeSeries | 'all';
type FilterOwned = 'all' | 'owned' | 'unowned';

export default function BadgeCollection() {
  const { userBadges, hasBadge, getBadgeCount, addBadgeToFridge, isOnFridge, fridgeDoor } = useGameStore();
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [filterSeries, setFilterSeries] = useState<FilterSeries>('all');
  const [filterOwned, setFilterOwned] = useState<FilterOwned>('all');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  // 3D viewer state
  const [viewing3DBadge, setViewing3DBadge] = useState<Badge | null>(null);

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
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors mb-2"
              >
                📌 贴到冰箱门
              </button>
            )}

            {/* 3D Viewer button */}
            <button
              onClick={() => {
                setViewing3DBadge(selectedBadgeData);
                setSelectedBadge(null);
              }}
              className="w-full py-2.5 rounded-xl border border-purple-600/60 bg-purple-900/20 hover:bg-purple-800/30 text-purple-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>🔮</span>
              <span>3D 欣赏</span>
            </button>
          </div>
        )}
      </Modal>

      {/* ── 3D Viewer Full-Screen Modal ─────────────────────── */}
      {viewing3DBadge && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-gray-950">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background: `linear-gradient(90deg, ${viewing3DBadge.bgGradient.includes('135deg') ? viewing3DBadge.bgGradient.replace('linear-gradient(135deg,', 'linear-gradient(90deg,') : viewing3DBadge.bgGradient})`,
              opacity: 0.95,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{viewing3DBadge.emoji}</span>
              <div>
                <p className="text-white font-bold text-base leading-tight">{viewing3DBadge.name}</p>
                <p
                  className="text-xs font-semibold"
                  style={{ color: RARITY_COLORS[viewing3DBadge.rarity] }}
                >
                  {RARITY_NAMES[viewing3DBadge.rarity]}
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewing3DBadge(null)}
              className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 3D Canvas */}
          <div className="flex-1 relative min-h-0">
            <Badge3DViewer badge={viewing3DBadge} className="w-full h-full" />

            {/* Interaction hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-xs text-gray-400 pointer-events-none select-none">
              <span className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
                <span>👆</span> 拖拽旋转
              </span>
              <span className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
                <span>🤏</span> 捏合缩放
              </span>
              <span className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
                <span>👆👆</span> 双击复位
              </span>
            </div>
          </div>

          {/* Bottom info strip */}
          <div className="flex-shrink-0 px-4 py-3 bg-gray-900/90 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center leading-relaxed italic">
              「{viewing3DBadge.storyText}」
            </p>
            {/* Switch to another owned badge */}
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1 justify-center">
              {userBadges.slice(0, 10).map((ub) => {
                const b = BADGE_MAP[ub.badgeId];
                if (!b) return null;
                return (
                  <button
                    key={b.id}
                    onClick={() => setViewing3DBadge(b)}
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all',
                      viewing3DBadge.id === b.id
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-60 hover:opacity-100',
                    )}
                    style={{ background: b.bgGradient }}
                    title={b.name}
                  >
                    {b.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
