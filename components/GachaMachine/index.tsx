'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store';
import { BADGE_MAP, RARITY_COLORS, RARITY_GLOW, RARITY_NAMES } from '@/lib/badges';
import { Badge } from '@/lib/types';
import { SINGLE_PULL_COST, TEN_PULL_COST } from '@/lib/gacha';
import { Button, RarityBadge } from '@/components/ui';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const GachaScene = dynamic(() => import('./GachaScene'), { ssr: false });

type AnimPhase = 'idle' | 'animating' | 'showing_result' | 'showing_multi';

export default function GachaMachine() {
  const { user, pityCount, pullSingle, pullTen, hasBadge } = useGameStore();
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [lastResults, setLastResults] = useState<Badge[]>([]);
  const [currentRarity, setCurrentRarity] = useState<Badge['rarity']>('common');
  const [currentSingleResult, setCurrentSingleResult] = useState<Badge | null>(null);
  const [isPullTen, setIsPullTen] = useState(false);

  const handleSinglePull = useCallback(() => {
    if (user.coins < SINGLE_PULL_COST) {
      toast.error('金币不足！先去签到赚点金币吧 🪙');
      return;
    }
    const result = pullSingle();
    if (!result) return;
    setCurrentRarity(result.badge.rarity);
    setCurrentSingleResult(result.badge);
    setIsPullTen(false);
    setPhase('animating');
  }, [user.coins, pullSingle]);

  const handleTenPull = useCallback(() => {
    if (user.coins < TEN_PULL_COST) {
      toast.error('金币不足！先去签到赚点金币吧 🪙');
      return;
    }
    const results = pullTen();
    if (!results) return;
    setLastResults(results.map((r) => r.badge));
    setCurrentRarity(results.reduce((best, r) => {
      const order = ['common', 'rare', 'epic', 'legendary'];
      return order.indexOf(r.badge.rarity) > order.indexOf(best) ? r.badge.rarity : best;
    }, 'common' as Badge['rarity']));
    setIsPullTen(true);
    setPhase('animating');
  }, [user.coins, pullTen]);

  const handleAnimationEnd = useCallback(() => {
    if (isPullTen) {
      setPhase('showing_multi');
    } else {
      setPhase('showing_result');
    }
  }, [isPullTen]);

  const handleClose = () => {
    setPhase('idle');
    setCurrentSingleResult(null);
    setLastResults([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Gacha Machine Title */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white">🎰 扭蛋机</h1>
        <p className="text-gray-400 text-sm mt-1">消耗金币抽取专属徽章</p>
      </div>

      {/* 3D Scene */}
      <div className="relative flex-1 min-h-0" style={{ minHeight: 220 }}>
        <GachaScene
          isAnimating={phase === 'animating'}
          rarity={currentRarity}
          onAnimationEnd={handleAnimationEnd}
        />

        {/* Pity indicator */}
        <div className="absolute top-2 left-2 right-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>保底进度</span>
            <span className={cn(
              'font-semibold',
              pityCount >= 74 ? 'text-orange-400' :
              pityCount >= 50 ? 'text-yellow-400' : 'text-gray-400'
            )}>
              {pityCount}/90
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                pityCount >= 74 ? 'bg-orange-400' :
                pityCount >= 50 ? 'bg-yellow-400' : 'bg-blue-500'
              )}
              style={{ width: `${(pityCount / 90) * 100}%` }}
            />
          </div>
          {pityCount >= 74 && (
            <p className="text-xs text-orange-400 mt-1 text-center animate-pulse">
              ⚡ 软保底激活！传说概率大幅提升
            </p>
          )}
        </div>
      </div>

      {/* Pull Buttons */}
      <div className="p-4 space-y-3">
        {/* Rate info */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: '普通', rate: '60%', color: 'text-gray-400' },
            { label: '稀有', rate: '30%', color: 'text-blue-400' },
            { label: '史诗', rate: '9%', color: 'text-purple-400' },
            { label: '传说', rate: '1%', color: 'text-yellow-400' },
          ].map(({ label, rate, color }) => (
            <div key={label} className="bg-gray-800/60 rounded-lg p-1.5">
              <div className={cn('text-xs font-bold', color)}>{label}</div>
              <div className={cn('text-sm font-semibold', color)}>{rate}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSinglePull}
            disabled={phase === 'animating' || user.coins < SINGLE_PULL_COST}
            className={cn(
              'relative overflow-hidden rounded-xl py-4 px-3 text-center transition-all duration-200',
              'bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600',
              'hover:border-blue-500 hover:from-gray-600 hover:to-gray-700',
              'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
              'group'
            )}
          >
            <div className="text-2xl mb-1">🎰</div>
            <div className="text-white font-bold text-sm">单抽</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="text-yellow-400 font-bold text-sm">{SINGLE_PULL_COST}</span>
            </div>
          </button>

          <button
            onClick={handleTenPull}
            disabled={phase === 'animating' || user.coins < TEN_PULL_COST}
            className={cn(
              'relative overflow-hidden rounded-xl py-4 px-3 text-center transition-all duration-200',
              'bg-gradient-to-b from-yellow-600/20 to-amber-900/20 border border-yellow-600/50',
              'hover:border-yellow-400 hover:from-yellow-600/30 hover:to-amber-800/30',
              'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {/* Discount badge */}
            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              9折
            </div>
            <div className="text-2xl mb-1">🎊</div>
            <div className="text-white font-bold text-sm">十连抽</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="text-yellow-400 font-bold text-sm">{TEN_PULL_COST}</span>
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          十连抽保证至少1枚稀有及以上 · 90抽必出传说
        </p>
      </div>

      {/* Single Result Modal */}
      {phase === 'showing_result' && currentSingleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border text-center animate-in zoom-in-95 duration-300"
            style={{ borderColor: `${RARITY_COLORS[currentSingleResult.rarity]}60` }}
          >
            {/* Glow effect for legendary/epic */}
            {(currentSingleResult.rarity === 'legendary' || currentSingleResult.rarity === 'epic') && (
              <div
                className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${RARITY_COLORS[currentSingleResult.rarity]}, transparent 70%)`,
                }}
              />
            )}

            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl"
              style={{
                background: currentSingleResult.bgGradient,
                boxShadow: `0 0 30px ${RARITY_GLOW[currentSingleResult.rarity]}, inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}
            >
              {currentSingleResult.emoji}
            </div>

            <RarityBadge rarity={currentSingleResult.rarity} size="md" className="mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">{currentSingleResult.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{currentSingleResult.description}</p>
            <p className="text-gray-500 text-xs italic mb-4 px-2">{currentSingleResult.storyText}</p>

            {hasBadge(currentSingleResult.id) && (
              <p className="text-amber-400 text-xs mb-3">✨ 重复徽章 → +10 碎片</p>
            )}

            <Button variant="gold" size="lg" onClick={handleClose} className="w-full">
              太棒了！
            </Button>
          </div>
        </div>
      )}

      {/* Ten Pull Results */}
      {phase === 'showing_multi' && lastResults.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">🎊 十连结果</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {lastResults.map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: badge.bgGradient,
                      boxShadow: `0 0 12px ${RARITY_GLOW[badge.rarity]}`,
                      border: `2px solid ${RARITY_COLORS[badge.rarity]}80`,
                    }}
                  >
                    {badge.emoji}
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: RARITY_COLORS[badge.rarity] }}
                  >
                    {RARITY_NAMES[badge.rarity]}
                  </span>
                  <span className="text-xs text-gray-400 text-center leading-tight line-clamp-1">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 bg-gray-800/60 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
              {['legendary', 'epic', 'rare', 'common'].map((r) => {
                const count = lastResults.filter((b) => b.rarity === r).length;
                return (
                  <div key={r}>
                    <div className="text-sm font-bold" style={{ color: RARITY_COLORS[r] }}>
                      {count}
                    </div>
                    <div className="text-xs text-gray-400">{RARITY_NAMES[r]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <Button variant="gold" size="lg" onClick={handleClose} className="w-full">
              收入囊中！
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
