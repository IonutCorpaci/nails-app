import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nails App — Кабинет Мастера",
  description: "Учет записей и база клиентов для мастера маникюра в Telegram",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nails App",
  },
};

// Запрещаем автоматическое масштабирование и зум при фокусе на инпутах в iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Корневой лэйаут (layout.tsx) — это общая обертка для всех страниц.
// Здесь подключаются глобальные стили, шрифты, контекст Telegram и нижнее меню навигации.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-tg-bg text-tg-text min-h-screen flex flex-col" suppressHydrationWarning>
        <TelegramProvider>
          {/* max-w-md mx-auto делает приложение центрированным и похожим на мобильный экран на компьютере */}
          <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-20 overflow-y-auto">
            {children}
          </main>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
