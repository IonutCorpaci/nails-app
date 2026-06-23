'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Script from 'next/script';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// Объявляем тип для глобального объекта Telegram WebApp, так как по умолчанию TS о нем не знает.
interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  themeParams: {
    bg_color?: string;
    secondary_bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  colorScheme: 'light' | 'dark';
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  isReady: boolean;
  user: TelegramUser | null;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  isReady: false,
  user: null,
});

export const useTelegram = () => useContext(TelegramContext);

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    // Вспомогательная функция, которая считывает цвета из Telegram SDK и вешает их на CSS-переменные (:root)
    const applyTheme = (tg: TelegramWebApp) => {
      const root = document.documentElement;
      
      const themeColors = {
        '--tg-bg-color': tg.themeParams.bg_color || '#f8fafc',
        '--tg-secondary-bg-color': tg.themeParams.secondary_bg_color || '#ffffff',
        '--tg-text-color': tg.themeParams.text_color || '#0f172a',
        '--tg-hint-color': tg.themeParams.hint_color || '#64748b',
        '--tg-link-color': tg.themeParams.link_color || '#db2777',
        '--tg-button-color': tg.themeParams.button_color || '#db2777',
        '--tg-button-text-color': tg.themeParams.button_text_color || '#ffffff',
      };

      Object.entries(themeColors).forEach(([variable, value]) => {
        root.style.setProperty(variable, value);
      });
      
      // Адаптируем цветовой режим для браузера
      root.classList.toggle('dark', tg.colorScheme === 'dark');
    };

    const handleTelegramInit = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Сигнализируем Telegram, что приложение полностью загрузилось и готово к показу
        tg.ready();
        
        // Разворачиваем приложение на весь экран телефона
        tg.expand();
        
        setWebApp(tg);
        setUser(tg.initDataUnsafe?.user || null);
        applyTheme(tg);
        setIsReady(true);
      }
    };

    // Проверяем, если скрипт уже загружен (на случай быстрых перерендеров)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      handleTelegramInit();
    }
  }, []);

  return (
    <>
      {/* Подгружаем официальный скрипт Telegram Web App */}
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Вызывается при загрузке скрипта
          if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            setWebApp(tg);
            setUser(tg.initDataUnsafe?.user || null);
            setIsReady(true);
          }
        }}
      />
      <TelegramContext.Provider value={{ webApp, isReady, user }}>
        {children}
      </TelegramContext.Provider>
    </>
  );
}
