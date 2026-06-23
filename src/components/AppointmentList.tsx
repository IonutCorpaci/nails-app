'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, Check, X, Clock, MapPin, DollarSign, Calendar, MessageSquare, Phone } from 'lucide-react';
import { format, isToday, isTomorrow, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AppointmentWithClient } from '@/types';

// Компонент списка записей для главного экрана с переключением "Сегодня / Завтра"
export default function AppointmentList() {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');

  // Загрузка записей с сервера для выбранного диапазона дат
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let start: Date;
      let end: Date;

      if (activeTab === 'today') {
        start = startOfDay(now);
        end = endOfDay(now);
      } else {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        start = startOfDay(tomorrow);
        end = endOfDay(tomorrow);
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
        setAppointments(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  // Быстрое изменение статуса записи (Выполнена / Отменена) прямо с главного экрана
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Локально обновляем статус в стейте, чтобы интерфейс отреагировал мгновенно
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
    }
  };

  // Хелпер для получения красивого цвета статуса (контрастные заливки с белым текстом для легкого чтения мамой)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-600 text-white font-bold dark:bg-blue-500';
      case 'COMPLETED':
        return 'bg-emerald-600 text-white font-bold dark:bg-emerald-500';
      case 'CANCELLED':
        return 'bg-rose-600 text-white font-bold dark:bg-rose-505';
      default:
        return 'bg-slate-500 text-white font-bold';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'Запланирована';
      case 'COMPLETED':
        return 'Выполнена';
      case 'CANCELLED':
        return 'Отменена';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Переключатель вкладок Сегодня / Завтра */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all ${
            activeTab === 'today'
              ? 'bg-tg-secondary-bg text-tg-text shadow-sm'
              : 'text-tg-hint'
          }`}
        >
          Сегодня
        </button>
        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all ${
            activeTab === 'tomorrow'
              ? 'bg-tg-secondary-bg text-tg-text shadow-sm'
              : 'text-tg-hint'
          }`}
        >
          Завтра
        </button>
      </div>

      {/* Список записей */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2 text-tg-hint">
          <Clock className="w-8 h-8 animate-spin" />
          <p className="text-sm">Загрузка записей...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-tg-secondary-bg rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <Calendar className="w-12 h-12 text-tg-hint/40 mb-3" />
          <h3 className="font-semibold text-tg-text mb-1">Нет записей</h3>
          <p className="text-sm text-tg-hint max-w-xs">
            На {activeTab === 'today' ? 'сегодня' : 'завтра'} записей не найдено. Нажми кнопку ниже, чтобы добавить запись.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="bg-tg-secondary-bg rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col space-y-3"
            >
              {/* Верхняя строка: Время и Статус */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-tg-text font-extrabold text-xl">
                  <Clock className="w-4.5 h-4.5 text-tg-button mr-1.5" />
                  {format(new Date(app.dateTime), 'HH:mm')}
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold ${getStatusBadgeClass(app.status)}`}>
                  {getStatusText(app.status)}
                </span>
              </div>

              {/* Средний блок: Клиент и Услуга */}
              <div>
                {app.clientId ? (
                  <Link
                    href={`/clients/${app.clientId}`}
                    className="font-extrabold text-base text-tg-text hover:underline hover:text-tg-button flex items-center group w-fit"
                  >
                    {app.clientName}
                    <span className="text-xs text-tg-button font-normal ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      профиль &rarr;
                    </span>
                  </Link>
                ) : (
                  <div className="font-extrabold text-base text-tg-text">{app.clientName}</div>
                )}
                <div className="text-sm text-tg-text/80 font-semibold mt-1">{app.service}</div>
              </div>

              {/* Детали: Локация, Цена, Заметки */}
              <div className="flex flex-wrap gap-y-2 gap-x-4 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/60 font-semibold">
                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      app.location === 'HOME'
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                    }`}
                  >
                    {app.location === 'HOME' ? 'Дома' : 'В салоне'}
                  </span>
                </div>
                <div className="flex items-center text-tg-text font-extrabold text-sm">
                  {app.price} <span className="text-tg-button ml-1">lei</span>
                </div>
                {app.notes && (
                  <div className="w-full flex items-start text-xs text-tg-text/80 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl mt-1 border border-slate-100 dark:border-slate-800/40 font-medium leading-relaxed">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-tg-button/80" />
                    <span>{app.notes}</span>
                  </div>
                )}
              </div>

              {/* Панель быстрых действий */}
              <div className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 justify-end w-full">
                {app.status === 'PLANNED' && (
                  <>
                    <button
                      onClick={() => updateStatus(app.id, 'COMPLETED')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-[11px] sm:text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/50 py-2.5 px-2 sm:px-3.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Готово
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, 'CANCELLED')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-[11px] sm:text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/50 py-2.5 px-2 sm:px-3.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" /> Отмена
                    </button>
                  </>
                )}
                
                <Link
                  href={`/appointments/${app.id}/edit`}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-[11px] sm:text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800 py-2.5 px-2 sm:px-3.5 rounded-xl font-bold transition-all active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" /> Изменить
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
