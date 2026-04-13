'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const PARTICLE_COUNT = 18;

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 30);

    const t1 = setTimeout(() => setPhase('show'), 300);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onFinish(), 2700);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #1e3a5f 0%, #0d1117 60%, #000 100%)',
        transition: 'opacity 0.5s ease',
        opacity: phase === 'exit' ? 0 : 1,
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Floating particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const size = 4 + (i % 4) * 3;
        const left = 5 + (i * 93) % 95;
        const delay = (i * 0.3) % 3;
        const duration = 3 + (i % 3);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: '-10px',
              background: ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899'][i % 5],
              opacity: 0.7,
              animation: `floatUp ${duration}s ${delay}s ease-in infinite`,
            }}
          />
        );
      })}

      {/* Fridge icon */}
      <div
        className="text-8xl mb-6 select-none"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.8))',
          transform: phase === 'show' ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
          transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        🧊
      </div>

      {/* Title */}
      <div
        style={{
          transform: phase === 'show' ? 'translateY(0)' : 'translateY(30px)',
          opacity: phase === 'show' ? 1 : 0,
          transition: 'all 0.5s ease 0.2s',
        }}
      >
        <h1
          className="text-3xl font-black text-center tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 50%, #f7971e 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}
        >
          冰箱贴徽章收集
        </h1>
        <p className="text-gray-400 text-center text-sm mt-2 tracking-widest">
          FRIDGE BADGE COLLECTION
        </p>
      </div>

      {/* Badge showcase row */}
      <div
        className="flex gap-3 mt-8"
        style={{
          opacity: phase === 'show' ? 1 : 0,
          transform: phase === 'show' ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease 0.4s',
        }}
      >
        {['🐉', '🦄', '⭐', '🚀', '🎸'].map((emoji, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: [
                'linear-gradient(135deg, #f7971e, #ffd200)',
                'linear-gradient(135deg, #f8cdda, #1d2671)',
                'linear-gradient(135deg, #f093fb, #f5576c)',
                'linear-gradient(135deg, #0c3483, #a2b6df)',
                'linear-gradient(135deg, #a18cd1, #fbc2eb)',
              ][i],
              boxShadow: [
                '0 0 15px rgba(245,158,11,0.6)',
                '0 0 15px rgba(139,92,246,0.6)',
                '0 0 15px rgba(236,72,153,0.6)',
                '0 0 15px rgba(59,130,246,0.6)',
                '0 0 15px rgba(139,92,246,0.4)',
              ][i],
              animation: `float ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Loading bar */}
      <div
        className="mt-10 w-48"
        style={{
          opacity: phase === 'show' ? 1 : 0,
          transition: 'opacity 0.5s ease 0.6s',
        }}
      >
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #f7971e, #ffd200)',
              boxShadow: '0 0 8px rgba(251,191,36,0.6)',
            }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-2 tracking-widest">
          LOADING...
        </p>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
