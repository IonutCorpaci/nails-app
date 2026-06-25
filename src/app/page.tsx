'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, TrendingUp, Calendar, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTelegram } from '@/components/TelegramProvider';
import AppointmentList from '@/components/AppointmentList';

// Главный экран приложения.
export default function Home() {
  const { user: tgUser } = useTelegram();
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [stats, setStats] = useState({ count: 0, earned: 0, planned: 0 });
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Загружаем имя текущего пользователя
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке пользователя:', error);
      }
    };
    fetchUser();
  }, []);

  // Загружаем статистику при загрузке страницы или при изменении периода
  useEffect(() => {
    setCurrentDateStr(format(new Date(), 'EEEE, d MMMM', { locale: ru }));

    const fetchStats = async () => {
      try {
        const start = new Date();
        const end = new Date();

        if (statsPeriod === 'day') {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
        } else if (statsPeriod === 'week') {
          // Получаем понедельник текущей недели
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1);
          start.setDate(diff);
          start.setHours(0, 0, 0, 0);
          
          // Конец недели (воскресенье)
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
        } else if (statsPeriod === 'month') {
          // Начало месяца
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          
          // Конец месяца
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
        }

        const response = await fetch(
          `/api/appointments?from=${start.toISOString()}&to=${end.toISOString()}`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          
          // Исключаем отмененные записи
          const activeAppts = data.filter((app: any) => app.status !== 'CANCELLED');
          
          // Считаем подтвержденный доход (выполненные записи)
          const earned = activeAppts
            .filter((app: any) => app.status === 'COMPLETED')
            .reduce((sum: number, app: any) => sum + app.price, 0);
            
          // Считаем запланированный доход (будущие записи)
          const planned = activeAppts
            .filter((app: any) => app.status === 'PLANNED')
            .reduce((sum: number, app: any) => sum + app.price, 0);

          setStats({
            count: activeAppts.length,
            earned,
            planned,
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
      }
    };

    fetchStats();
  }, [statsPeriod]);

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти из кабинета?')) {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Шапка приветствия с именем мастера и кнопкой выхода */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs text-tg-hint uppercase tracking-wider font-semibold">
            {currentDateStr || 'Сегодня'}
          </span>
          <h1 className="text-2xl font-bold text-tg-text flex items-center gap-1.5 mt-0.5 capitalize">
            Привет, {currentUser?.name || tgUser?.first_name || 'Мастер'}! <Sparkles className="w-5 h-5 text-tg-button fill-tg-button/20" />
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-xl transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700/50 active:scale-95 flex items-center justify-center"
          title="Выйти из аккаунта"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Улучшенная карточка статистики с выбором периода */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-8 -mb-8"></div>
        <div className="absolute left-1/3 top-0 w-20 h-20 bg-white/10 rounded-full blur-lg -mt-6"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium opacity-90">Сводка доходов</span>
            {/* Переключатель периода (День / Неделя / Месяц) */}
            <div className="bg-white/15 p-0.5 rounded-lg flex text-[10px] font-bold backdrop-blur-md border border-white/10">
              <button
                onClick={() => setStatsPeriod('day')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statsPeriod === 'day' ? 'bg-white text-rose-600 shadow-sm' : 'text-white hover:bg-white/5'
                }`}
              >
                День
              </button>
              <button
                onClick={() => setStatsPeriod('week')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statsPeriod === 'week' ? 'bg-white text-rose-600 shadow-sm' : 'text-white hover:bg-white/5'
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setStatsPeriod('month')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statsPeriod === 'month' ? 'bg-white text-rose-600 shadow-sm' : 'text-white hover:bg-white/5'
                }`}
              >
                Месяц
              </button>
            </div>
          </div>

          {/* Отображение трех колонок: Записи, Выполнено, Ожидается */}
          <div className="grid grid-cols-3 gap-2 divide-x divide-white/20">
            <div className="space-y-1">
              <span className="text-[10px] opacity-80 block uppercase font-bold tracking-wider">Записи</span>
              <div className="text-xl font-extrabold flex items-center">
                <Calendar className="w-4 h-4 mr-1 opacity-80" />
                {stats.count}
              </div>
            </div>
            <div className="pl-3 space-y-1">
              <span className="text-[10px] opacity-80 block uppercase font-bold tracking-wider text-emerald-200">Сделано</span>
              <div className="text-lg font-extrabold text-emerald-100 truncate">
                {stats.earned} lei
              </div>
            </div>
            <div className="pl-3 space-y-1">
              <span className="text-[10px] opacity-80 block uppercase font-bold tracking-wider text-sky-200">Ожидается</span>
              <div className="text-lg font-extrabold text-sky-100 truncate">
                {stats.planned} lei
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Список записей */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-tg-text">Расписание записей</h2>
        <AppointmentList />
      </div>

      {/* Плавающая кнопка добавления (FAB) */}
      <Link
        href="/appointments/new"
        className="fixed bottom-20 right-6 w-14 h-14 bg-tg-button hover:bg-tg-button/95 text-tg-button-text rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 z-40 border-2 border-white dark:border-slate-900"
        aria-label="Добавить запись"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  );
}
