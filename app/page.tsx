'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { BADGE_MAP, RARITY_COLORS, RARITY_GLOW } from '@/lib/badges';
import { Button, Modal, RarityBadge } from '@/components/ui';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { canCheckinToday } from '@/lib/gacha';

const FridgeDoor = dynamic(() => import('@/components/FridgeDoor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-300/20 animate-pulse rounded-2xl">
      <div className="text-center">
        <div className="text-5xl mb-2 animate-bounce">🧊</div>
        <span className="text-gray-400 text-sm">冰箱门加载中...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const {
    user,
    fridgeDoor,
    userBadges,
    addBadgeToFridge,
    removeBadgeFromFridge,
    checkin,
  } = useGameStore();

  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{ coins: number; streak: number } | null>(null);

  const canCheckin = canCheckinToday(user.lastCheckin);

  const handleBadgeClick = useCallback((badgeId: string) => {
    setSelectedBadge(badgeId);
  }, []);

  const handleCheckin = () => {
    const result = checkin();
    if (result) {
      setCheckinResult({ coins: result.coins, streak: result.streak });
      setShowCheckinModal(true);
    } else {
      toast('今天已签到过了，明天再来哦 😊');
    }
  };

  const handleAddToFridge = useCallback(() => {
    if (!selectedBadge) return;
    addBadgeToFridge(
      selectedBadge,
      15 + Math.random() * 70,
      15 + Math.random() * 70
    );
    setSelectedBadge(null);
    toast.success('贴到冰箱门啦 📌');
  }, [selectedBadge, addBadgeToFridge]);

  const selectedBadgeData = selectedBadge ? BADGE_MAP[selectedBadge] : null;
  const selectedOnFridge = fridgeDoor.placements.some(p => p.badgeId === selectedBadge);
  const fridgeFull = fridgeDoor.placements.length >= fridgeDoor.maxSlots;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🧊</span>
            <span>我的冰箱</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {user.username} · Lv.{user.level}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-800/80 rounded-full px-3 py-1.5">
            <span className="text-base">🪙</span>
            <span className="text-yellow-400 font-bold text-sm">{user.coins.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckin}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95',
              canCheckin
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/30'
                : 'bg-gray-800 text-gray-500'
            )}
          >
            {canCheckin ? '✨ 签到' : '已签到'}
          </button>
        </div>
      </div>

      {/* Fridge Door */}
      <div
        className="flex-1 mx-4 rounded-2xl overflow-hidden relative"
        style={{
          boxShadow: '0 0 0 3px #4b5563, 0 0 0 5px #374151, 0 20px 60px rgba(0,0,0,0.5)',
          minHeight: 0,
        }}
      >
        {/* Handle */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-2.5 h-20 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-md pointer-events-none" />
        <FridgeDoor onBadgeClick={handleBadgeClick} />
      </div>

      {/* Bottom panel */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Slot indicator */}
          <div className="flex-1 bg-gray-800/60 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">冰箱徽章</span>
              <span className="text-xs text-gray-400">
                <span className="text-white font-bold">{fridgeDoor.placements.length}</span>/{fridgeDoor.maxSlots}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: fridgeDoor.maxSlots }).map((_, i) => {
                const p = fridgeDoor.placements[i];
                const badge = p ? BADGE_MAP[p.badgeId] : null;
                return (
                  <div
                    key={i}
                    className="h-5 flex-1 rounded-sm transition-all"
                    style={{
                      background: badge ? RARITY_COLORS[badge.rarity] : '#374151',
                      opacity: badge ? 1 : 0.4,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={() => router.push('/gacha')}
            className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl px-4 py-2.5 text-sm transition-all active:scale-95 shadow-lg shadow-purple-500/30"
          >
            🎰 去抽奖
          </button>
        </div>

        {/* My badges quick view */}
        {userBadges.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">我的徽章（{userBadges.length}枚）</span>
              <button
                onClick={() => router.push('/collection')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                查看全部 →
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {userBadges.slice(0, 12).map((ub) => {
                const badge = BADGE_MAP[ub.badgeId];
                if (!badge) return null;
                const onFridge = fridgeDoor.placements.some(p => p.badgeId === ub.badgeId);
                return (
                  <button
                    key={ub.badgeId}
                    onClick={() => setSelectedBadge(ub.badgeId)}
                    className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform active:scale-90"
                    style={{
                      background: badge.bgGradient,
                      boxShadow: `0 0 8px ${RARITY_GLOW[badge.rarity]}`,
                      border: `2px solid ${RARITY_COLORS[badge.rarity]}60`,
                      opacity: onFridge ? 0.5 : 1,
                    }}
                    title={badge.name}
                  >
                    {badge.emoji}
                    {onFridge && (
                      <div className="absolute -top-0.5 -right-0.5 text-xs">📌</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {userBadges.length === 0 && (
          <p className="mt-2 text-center text-xs text-gray-500">
            还没有徽章？初始赠送 <span className="text-yellow-400 font-bold">1600 🪙</span>，去扭蛋机抽取吧！
          </p>
        )}
      </div>

      {/* Badge detail modal */}
      <Modal isOpen={!!selectedBadgeData} onClose={() => setSelectedBadge(null)} size="md">
        {selectedBadgeData && (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl"
              style={{
                background: selectedBadgeData.bgGradient,
                boxShadow: `0 0 30px ${RARITY_GLOW[selectedBadgeData.rarity]}`,
                border: `3px solid ${RARITY_COLORS[selectedBadgeData.rarity]}80`,
              }}
            >
              {selectedBadgeData.emoji}
            </div>
            <RarityBadge rarity={selectedBadgeData.rarity} className="mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">{selectedBadgeData.name}</h3>
            <p className="text-xs text-gray-400 mt-1 mb-3">{selectedBadgeData.description}</p>
            <p className="text-gray-500 text-xs italic mb-4 px-2 leading-relaxed">
              「{selectedBadgeData.storyText}」
            </p>
            <div className="flex gap-2 justify-center">
              {selectedOnFridge ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    removeBadgeFromFridge(selectedBadge!);
                    setSelectedBadge(null);
                    toast('已从冰箱取下');
                  }}
                >
                  📌 从冰箱取下
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={fridgeFull}
                  onClick={handleAddToFridge}
                >
                  {fridgeFull ? '冰箱已满' : '📌 贴到冰箱门'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => { router.push('/collection'); setSelectedBadge(null); }}>
                查看图鉴
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Check-in reward modal */}
      <Modal isOpen={showCheckinModal} onClose={() => setShowCheckinModal(false)} size="sm">
        {checkinResult && (
          <div className="text-center py-4">
            <div className="text-6xl mb-4 animate-bounce">🎁</div>
            <h3 className="text-xl font-bold text-white mb-2">签到成功！</h3>
            <p className="text-gray-400 text-sm mb-4">
              连续签到 <span className="text-yellow-400 font-bold">{checkinResult.streak}</span> 天
            </p>
            <div
              className="text-4xl font-bold mb-4"
              style={{
                background: 'linear-gradient(135deg, #f7971e, #ffd200)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              +{checkinResult.coins} 🪙
            </div>
            {checkinResult.streak >= 7 && (
              <p className="text-yellow-400 text-sm mb-3">🎉 连签7天特别奖励加成！</p>
            )}
            <Button variant="gold" onClick={() => setShowCheckinModal(false)} className="w-full">
              太棒了！
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
