'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, BookOpen, User } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: '冰箱门', emoji: '🧊' },
  { href: '/gacha', icon: Zap, label: '扭蛋', emoji: '🎰' },
  { href: '/collection', icon: BookOpen, label: '图鉴', emoji: '📖' },
  { href: '/profile', icon: User, label: '我的', emoji: '👤' },
];

export default function Navigation() {
  const pathname = usePathname();
  const user = useGameStore((s) => s.user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/60 safe-bottom">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-stretch justify-around">
          {NAV_ITEMS.map(({ href, label, emoji }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 px-4 flex-1 transition-all duration-200 relative',
                  isActive
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow-400 rounded-full" />
                )}
                <span className="text-xl leading-none">{emoji}</span>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Coins display */}
      <div className="absolute top-3 right-4 flex items-center gap-1 text-xs text-yellow-400 font-semibold">
        <span>🪙</span>
        <span>{user.coins.toLocaleString()}</span>
      </div>
    </nav>
  );
}
