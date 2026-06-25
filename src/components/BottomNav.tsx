'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutDashboard, Users } from 'lucide-react';

// Компонент нижней навигации (Bottom Bar) для мобильного приложения.
// Он использует Client Component, так как реагирует на изменение текущего URL (usePathname).
export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const navItems = [
    {
      label: 'Главная',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Календарь',
      href: '/calendar',
      icon: Calendar,
    },
    {
      label: 'Клиенты',
      href: '/clients',
      icon: Users,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-tg-secondary-bg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-50 px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        // Определяем, активна ли текущая кнопка меню
        const isActive = item.href === '/' 
          ? pathname === '/' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
              isActive 
                ? 'text-tg-button font-medium scale-105' 
                : 'text-tg-hint hover:text-tg-text'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] sm:text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
