'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { BADGE_MAP, RARITY_COLORS, RARITY_GLOW } from '@/lib/badges';
import { FridgePlacement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BadgeOnFridgeProps {
  placement: FridgePlacement;
  onDragStart?: (e: React.PointerEvent, badgeId: string) => void;
  onClick?: (badgeId: string) => void;
  isSelected?: boolean;
}

function BadgeOnFridge({ placement, onDragStart, onClick, isSelected }: BadgeOnFridgeProps) {
  const badge = BADGE_MAP[placement.badgeId];
  if (!badge) return null;

  const glowColor = RARITY_GLOW[badge.rarity];
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <div
      className={cn(
        'absolute cursor-grab active:cursor-grabbing select-none',
        'transition-shadow duration-200',
        isSelected && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent'
      )}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg) scale(${placement.scale})`,
        zIndex: placement.zIndex,
        filter: `drop-shadow(0 4px 8px ${glowColor})`,
      }}
      onPointerDown={(e) => onDragStart?.(e, placement.badgeId)}
      onClick={() => onClick?.(placement.badgeId)}
    >
      {/* Badge body */}
      <div
        className="relative w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{
          background: badge.bgGradient,
          boxShadow: `
            2px 4px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -1px 0 rgba(0,0,0,0.2),
            0 0 12px ${glowColor}
          `,
          border: `2px solid ${rarityColor}60`,
        }}
      >
        {/* Inner shine */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.8) 0%, transparent 60%)',
          }}
        />
        <span className="relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
          {badge.emoji}
        </span>
      </div>

      {/* Magnetic "nub" at bottom */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-full opacity-60"
        style={{ background: `${rarityColor}` }}
      />
    </div>
  );
}

interface FridgeDoorComponentProps {
  onBadgeClick?: (badgeId: string) => void;
}

export default function FridgeDoorComponent({ onBadgeClick }: FridgeDoorComponentProps) {
  const { fridgeDoor, updateBadgePlacement, removeBadgeFromFridge } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef<{
    badgeId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, badgeId: string) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const placement = fridgeDoor.placements.find((p) => p.badgeId === badgeId);
    if (!placement) return;

    dragInfo.current = {
      badgeId,
      startX: e.clientX,
      startY: e.clientY,
      origX: placement.x,
      origY: placement.y,
    };

    // Bring to front
    const maxZ = fridgeDoor.placements.reduce((m, p) => Math.max(m, p.zIndex), 0);
    updateBadgePlacement(badgeId, { zIndex: maxZ + 1 });
    setIsDragging(true);

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragInfo.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const dx = ((moveEvent.clientX - dragInfo.current.startX) / containerRect.width) * 100;
      const dy = ((moveEvent.clientY - dragInfo.current.startY) / containerRect.height) * 100;
      const newX = Math.max(5, Math.min(95, dragInfo.current.origX + dx));
      const newY = Math.max(5, Math.min(95, dragInfo.current.origY + dy));
      updateBadgePlacement(dragInfo.current.badgeId, { x: newX, y: newY });
    };

    const handleUp = (upEvent: PointerEvent) => {
      setIsDragging(false);
      const moved =
        Math.abs(upEvent.clientX - (dragInfo.current?.startX ?? 0)) > 5 ||
        Math.abs(upEvent.clientY - (dragInfo.current?.startY ?? 0)) > 5;

      if (!moved && dragInfo.current) {
        // It was a click
        setSelectedBadge(dragInfo.current.badgeId);
        onBadgeClick?.(dragInfo.current.badgeId);
      }

      dragInfo.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [fridgeDoor.placements, updateBadgePlacement, onBadgeClick]);

  // Deselect on outside click
  const handleContainerClick = useCallback(() => {
    if (!isDragging) setSelectedBadge(null);
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      onClick={handleContainerClick}
      style={{
        background: `
          linear-gradient(135deg,
            #b8cad8 0%,
            #d4e0ec 15%,
            #c0cfdc 30%,
            #dce8f2 50%,
            #b4c6d6 65%,
            #ccdae8 80%,
            #b0c2d2 100%
          )
        `,
        boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.15), inset 0 -2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* Metal texture overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.05) 2px,
              rgba(255,255,255,0.05) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 30px,
              rgba(0,0,0,0.03) 30px,
              rgba(0,0,0,0.03) 60px
            )
          `,
        }}
      />

      {/* Shine effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 40%, transparent 70%, rgba(255,255,255,0.2) 100%)',
        }}
      />

      {/* Magnetic border strips (horizontal) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-600/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-600/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-r from-gray-600/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-l from-gray-600/30 to-transparent pointer-events-none" />

      {/* Empty state hint */}
      {fridgeDoor.placements.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500/60 pointer-events-none">
          <div className="text-6xl mb-4 opacity-40">🧲</div>
          <p className="text-base font-medium opacity-60">将徽章拖拽到冰箱门上</p>
          <p className="text-sm opacity-40 mt-1">先去扭蛋抽取徽章吧～</p>
        </div>
      )}

      {/* Badges */}
      {fridgeDoor.placements.map((placement) => (
        <BadgeOnFridge
          key={placement.badgeId}
          placement={placement}
          onDragStart={handlePointerDown}
          onClick={(id) => {
            setSelectedBadge(id);
            onBadgeClick?.(id);
          }}
          isSelected={selectedBadge === placement.badgeId}
        />
      ))}

      {/* Slot counter */}
      <div className="absolute top-3 right-3 text-xs text-gray-600/70 bg-white/30 backdrop-blur-sm rounded-full px-2 py-1 pointer-events-none">
        {fridgeDoor.placements.length}/{fridgeDoor.maxSlots}
      </div>
    </div>
  );
}
