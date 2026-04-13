'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import {
  BADGES,
  RARITY_COLORS,
  RARITY_NAMES,
  SERIES_NAMES,
  SERIES_EMOJIS,
  SERIES_LIST,
} from '@/lib/badges';
import { Modal, Button } from '@/components/ui';
import { canCheckinToday, getCheckinReward } from '@/lib/gacha';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const AVATAR_OPTIONS = ['🧊', '🐼', '🦊', '🐉', '🌈', '🚀', '🦄', '🎸', '🧙', '🤖', '💎', '🌸'];

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    userBadges,
    fridgeDoor,
    gachaRecords,
    checkinLogs,
    checkin,
    updateUsername,
    updateAvatar,
    pityCount,
  } = useGameStore();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user.username);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);

  const canCheckinToday_ = canCheckinToday(user.lastCheckin);

  const legendaryCount = userBadges.filter((ub) => {
    const b = BADGES.find((b) => b.id === ub.badgeId);
    return b?.rarity === 'legendary';
  }).length;

  const epicCount = userBadges.filter((ub) => {
    const b = BADGES.find((b) => b.id === ub.badgeId);
    return b?.rarity === 'epic';
  }).length;

  const rareCount = userBadges.filter((ub) => {
    const b = BADGES.find((b) => b.id === ub.badgeId);
    return b?.rarity === 'rare';
  }).length;

  const completedSeries = SERIES_LIST.filter((series) =>
    BADGES.filter((b) => b.series === series).every((b) =>
      userBadges.some((ub) => ub.badgeId === b.id)
    )
  );

  const handleSaveName = () => {
    if (newName.trim().length < 1) return;
    updateUsername(newName.trim());
    setEditingName(false);
    toast.success('昵称已更新 ✓');
  };

  const handleCheckin = () => {
    const result = checkin();
    if (result) {
      toast.success(`签到成功！+${result.coins} 🪙 连签${result.streak}天`);
    } else {
      toast('今日已签到');
    }
  };

  // Stat cards
  const stats = [
    { label: '总徽章', value: userBadges.length, icon: '🏷️', color: 'text-white' },
    { label: '传说', value: legendaryCount, icon: '✨', color: 'text-yellow-400' },
    { label: '史诗', value: epicCount, icon: '💜', color: 'text-purple-400' },
    { label: '稀有', value: rareCount, icon: '💙', color: 'text-blue-400' },
    { label: '抽奖次数', value: gachaRecords.length, icon: '🎰', color: 'text-gray-300' },
    { label: '集齐系列', value: completedSeries.length, icon: '🏆', color: 'text-green-400' },
    { label: '签到天数', value: user.totalCheckins, icon: '📅', color: 'text-blue-300' },
    { label: '连续签到', value: user.checkinStreak, icon: '🔥', color: 'text-orange-400' },
  ];

  return (
    <div className="flex flex-col overflow-y-auto scrollable h-screen max-h-screen">
      {/* Profile Header */}
      <div
        className="relative px-4 pt-6 pb-8"
        style={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        }}
      >
        <h1 className="text-xl font-bold text-white mb-4">👤 个人中心</h1>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <button
            onClick={() => setShowAvatarModal(true)}
            className="w-20 h-20 rounded-full bg-gray-700/60 border-2 border-yellow-400/40 flex items-center justify-center text-4xl hover:border-yellow-400 transition-colors relative"
          >
            {user.avatar}
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-xs border border-gray-600">
              ✏️
            </div>
          </button>

          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button onClick={handleSaveName} className="text-green-400 text-lg">✓</button>
                <button onClick={() => setEditingName(false)} className="text-red-400 text-lg">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{user.username}</span>
                <button onClick={() => { setEditingName(true); setNewName(user.username); }} className="text-gray-400 text-sm hover:text-white">✏️</button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">Lv.{user.level}</span>
              <span className="text-xs text-gray-400">
                加入 {new Date(user.joinedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400 text-sm">🪙</span>
              <span className="text-yellow-400 font-bold text-sm">{user.coins.toLocaleString()}</span>
              <span className="text-gray-500 text-xs ml-2">碎片 {user.fragments}</span>
            </div>
          </div>
        </div>

        {/* Pity info */}
        <div className="mt-4 bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-300">传说保底进度</span>
            <span className={cn('font-bold', pityCount >= 74 ? 'text-orange-400' : 'text-gray-300')}>
              {pityCount}/90
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full">
            <div
              className={cn(
                'h-full rounded-full',
                pityCount >= 74 ? 'bg-orange-400' : pityCount >= 50 ? 'bg-yellow-400' : 'bg-blue-500'
              )}
              style={{ width: `${(pityCount / 90) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Check-in card */}
      <div className="mx-4 -mt-4 bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-700 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">每日签到</div>
            <div className="text-xs text-gray-400 mt-0.5">
              今日奖励: <span className="text-yellow-400 font-bold">+{getCheckinReward(user.checkinStreak + 1)} 🪙</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              连续签到 <span className="text-orange-400 font-bold">{user.checkinStreak}</span> 天
            </div>
          </div>
          <button
            onClick={handleCheckin}
            disabled={!canCheckinToday_}
            className={cn(
              'px-4 py-2 rounded-xl font-bold text-sm transition-all',
              canCheckinToday_
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black active:scale-95'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            {canCheckinToday_ ? '✨ 签到' : '已签到'}
          </button>
        </div>

        {/* 7-day streak display */}
        <div className="flex gap-1 mt-3">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayNum = i + 1;
            const isFilled = user.checkinStreak >= dayNum;
            const isToday = user.checkinStreak % 7 === i || (user.checkinStreak === 7 && i === 6);
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-center transition-all',
                  isFilled
                    ? 'bg-yellow-500/20 border border-yellow-500/40'
                    : 'bg-gray-700/40 border border-gray-700'
                )}
              >
                <div className="text-xs">{['一', '二', '三', '四', '五', '六', '七'][i]}</div>
                <div className={cn('text-xs font-bold', isFilled ? 'text-yellow-400' : 'text-gray-600')}>
                  +{[50, 60, 70, 80, 100, 120, 200][i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">收集统计</h2>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon, color }) => (
            <div key={label} className="bg-gray-800/60 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className={cn('text-lg font-bold', color)}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Series */}
      {completedSeries.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">已集齐系列</h2>
          <div className="flex flex-wrap gap-2">
            {completedSeries.map((s) => (
              <div
                key={s}
                className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1.5"
              >
                <span>{SERIES_EMOJIS[s]}</span>
                <span className="text-xs text-yellow-300 font-medium">{SERIES_NAMES[s]}</span>
                <span className="text-xs text-yellow-400">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Progress by Series */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">系列进度</h2>
        <div className="space-y-2">
          {SERIES_LIST.map((series) => {
            const seriesBadges = BADGES.filter((b) => b.series === series);
            const ownedInSeries = seriesBadges.filter((b) =>
              userBadges.some((ub) => ub.badgeId === b.id)
            ).length;
            const isComplete = ownedInSeries === seriesBadges.length;
            return (
              <div key={series} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{SERIES_EMOJIS[series]}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300">{SERIES_NAMES[series]}</span>
                    <span className={cn('text-xs font-bold', isComplete ? 'text-yellow-400' : 'text-gray-400')}>
                      {ownedInSeries}/{seriesBadges.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isComplete
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                          : 'bg-blue-500'
                      )}
                      style={{ width: `${(ownedInSeries / seriesBadges.length) * 100}%` }}
                    />
                  </div>
                </div>
                {isComplete && <span className="text-yellow-400 text-sm">🏆</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-8 space-y-2">
        <button
          onClick={() => setShowRecordsModal(true)}
          className="w-full flex items-center justify-between bg-gray-800/60 hover:bg-gray-700/60 rounded-xl px-4 py-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <span className="text-sm text-white font-medium">抽奖记录</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span>共 {gachaRecords.length} 次</span>
            <span>›</span>
          </div>
        </button>

        <button
          onClick={() => {
            const state = useGameStore.getState();
            const text = `我已收集 ${userBadges.length} 枚徽章，其中传说 ${legendaryCount} 枚！🧊✨`;
            if (navigator.share) {
              navigator.share({ title: '冰箱贴徽章收集游戏', text, url: window.location.origin });
            } else {
              navigator.clipboard.writeText(text);
              toast.success('分享内容已复制到剪贴板！');
            }
          }}
          className="w-full flex items-center justify-between bg-gray-800/60 hover:bg-gray-700/60 rounded-xl px-4 py-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📤</span>
            <span className="text-sm text-white font-medium">分享我的收集</span>
          </div>
          <span className="text-gray-400 text-xs">›</span>
        </button>
      </div>

      {/* Avatar Selection Modal */}
      <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="选择头像">
        <div className="grid grid-cols-6 gap-3">
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                updateAvatar(emoji);
                setShowAvatarModal(false);
                toast.success('头像已更换 ✓');
              }}
              className={cn(
                'w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all',
                user.avatar === emoji
                  ? 'bg-yellow-500/20 border-2 border-yellow-500 scale-110'
                  : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Modal>

      {/* Pull Records Modal */}
      <Modal isOpen={showRecordsModal} onClose={() => setShowRecordsModal(false)} title="最近抽奖记录" size="lg">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {gachaRecords.slice(0, 50).map((record) => {
            const badge = BADGES.find((b) => b.id === record.badgeId);
            if (!badge) return null;
            return (
              <div key={record.id} className="flex items-center gap-3 py-2 border-b border-gray-800">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: badge.bgGradient }}
                >
                  {badge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{badge.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: RARITY_COLORS[badge.rarity],
                    backgroundColor: `${RARITY_COLORS[badge.rarity]}20`,
                  }}
                >
                  {RARITY_NAMES[badge.rarity]}
                </span>
              </div>
            );
          })}
          {gachaRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">还没有抽奖记录</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
