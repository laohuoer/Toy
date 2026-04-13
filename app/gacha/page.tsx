'use client';

import dynamic from 'next/dynamic';

const GachaMachine = dynamic(() => import('@/components/GachaMachine'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-4xl animate-spin">🎰</div>
    </div>
  ),
});

export default function GachaPage() {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <GachaMachine />
    </div>
  );
}
