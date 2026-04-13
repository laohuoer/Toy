import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '冰箱贴徽章收集游戏',
  description: '收集你的专属数字冰箱贴徽章，在虚拟冰箱门上展示你的独特品味',
  keywords: ['徽章', '收集', '扭蛋', '冰箱贴', '游戏'],
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <main className="max-w-lg mx-auto min-h-screen flex flex-col pb-20 relative">
          {children}
        </main>
        <Navigation />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#fbbf24', secondary: '#000' },
            },
          }}
        />
      </body>
    </html>
  );
}
