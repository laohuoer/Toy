'use client';

import { RARITY_NAMES, RARITY_COLORS, RARITY_GLOW } from '@/lib/badges';
import { Rarity } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RarityBadgeProps {
  rarity: Rarity;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RarityBadge({ rarity, className, size = 'sm' }: RarityBadgeProps) {
  const color = RARITY_COLORS[rarity];
  const name = RARITY_NAMES[rarity];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-bold tracking-wide',
        sizeClasses[size],
        className
      )}
      style={{
        color: color,
        backgroundColor: `${color}20`,
        border: `1px solid ${color}60`,
        textShadow: rarity === 'legendary' ? `0 0 8px ${color}` : undefined,
      }}
    >
      {rarity === 'legendary' && '✨ '}
      {rarity === 'epic' && '💜 '}
      {rarity === 'rare' && '💙 '}
      {name}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
    ghost: 'bg-transparent hover:bg-gray-700/50 text-gray-300 border-gray-600',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-red-500',
    gold: 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold border-yellow-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    full: 'max-w-full m-4',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
