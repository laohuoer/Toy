import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import GameShell from '@/components/GameShell';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🧊 冰箱贴徽章收集游戏',
  description: '收集你的专属数字冰箱贴徽章，在虚拟冰箱门上展示你的独特品味！',
  keywords: ['徽章', '收集', '扭蛋', '冰箱贴', 'H5游戏', '手机游戏'],
  manifest: '/Toy/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '徽章收集',
  },
  icons: {
    icon: '/Toy/icons/icon.svg',
    apple: '/Toy/icons/icon.svg',
  },
  openGraph: {
    title: '🧊 冰箱贴徽章收集游戏',
    description: '扭蛋抽取徽章，贴满你的虚拟冰箱门！',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f59e0b',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        {/* PWA / iOS Safari */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="徽章收集" />
        <meta name="format-detection" content="telephone=no" />
        {/* Android Chrome */}
        <meta name="theme-color" content="#f59e0b" />
        <link rel="manifest" href="/Toy/manifest.json" />
        {/* SPA redirect handler */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var p = sessionStorage.getItem('spa_redirect');
              if (p) {
                sessionStorage.removeItem('spa_redirect');
                window.history.replaceState(null, '', p);
              }
            })();
          `
        }} />
      </head>
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <GameShell>
          <main className="max-w-lg mx-auto min-h-screen flex flex-col pb-[72px] relative">
            {children}
          </main>
          <Navigation />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 2500,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#fbbf24', secondary: '#000' },
              },
            }}
          />
        </GameShell>
      </body>
    </html>
  );
}
