'use client';

import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';

export default function GameShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only show splash on first visit per session
    const seen = sessionStorage.getItem('splash_seen');
    if (seen) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem('splash_seen', '1');
    setShowSplash(false);
  };

  if (!mounted) {
    // SSR skeleton — keep same DOM structure
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🧊</div>
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.4s ease',
          minHeight: '100vh',
        }}
      >
        {children}
      </div>
    </>
  );
}
