'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Edit2 } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  format,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { AppointmentWithClient } from '@/types';

// Интерактивная страница Календаря.
// Позволяет просматривать записи по дням месяца с точками-индикаторами.
export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthAppointments, setMonthAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Вычисляем начало и конец месяца для загрузки всех записей за этот период
  const startOfRange = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const endOfRange = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

  const fetchMonthAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/appointments?from=${startOfRange.toISOString()}&to=${endOfRange.toISOString()}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMonthAppointments(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки записей за месяц:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthAppointments();
  }, [currentMonth]);

  // Генерируем массив всех дней, которые попадут в сетку календаря текущего месяца (включая "хвосты" соседних месяцев)
  const days = eachDayOfInterval({ start: startOfRange, end: endOfRange });

  // Фильтруем записи для отображения под календарем на выбранный день
  const selectedDayAppointments = monthAppointments.filter((app) =>
    isSameDay(new Date(app.dateTime), selectedDate)
  );

  // Проверяем, есть ли хотя бы одна запись на конкретный день (для отрисовки точки)
  const hasAppointments = (day: Date) => {
    return monthAppointments.some((app) => 
      isSameDay(new Date(app.dateTime), day) && app.status !== 'CANCELLED'
    );
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Русский алфавит дней недели для заголовка таблицы
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-xl font-bold text-tg-text flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-tg-button" /> Календарь
        </h1>
        <p className="text-xs text-tg-hint mt-0.5">Планирование записей и расписание по дням</p>
      </div>

      {/* Сам блок календаря */}
      <div className="bg-tg-secondary-bg rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Переключатель месяца */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="p-2 text-tg-text hover:text-tg-button transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-tg-text capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 text-tg-text hover:text-tg-button transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-tg-hint mb-2">
          {weekDays.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Сетка дней */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDay = isSameDay(day, new Date());
            const hasApp = hasAppointments(day);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`py-2 relative flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-tg-button text-tg-button-text font-bold'
                    : isTodayDay
                    ? 'bg-pink-50 text-tg-button dark:bg-pink-950/20'
                    : isCurrentMonth
                    ? 'text-tg-text'
                    : 'text-tg-hint/40'
                }`}
              >
                <span>{format(day, 'd')}</span>
                {/* Точка-индикатор наличия записей */}
                {hasApp && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-tg-button-text' : 'bg-tg-button'
                    }`}
                  ></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Список записей на выбранный день */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-tg-text">
            {format(selectedDate, 'd MMMM', { locale: ru })}
          </h2>
          
          <Link
            href={`/appointments/new?date=${selectedDate.toISOString()}`}
            className="flex items-center gap-1 text-xs text-tg-button font-semibold"
          >
            <Plus className="w-4 h-4" /> Добавить
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-tg-hint">Загрузка расписания...</div>
        ) : selectedDayAppointments.length === 0 ? (
          <div className="text-center py-10 bg-tg-secondary-bg border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-xs text-tg-hint">
            Нет записей на выбранный день.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-tg-secondary-bg rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 flex justify-between items-center shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-bold text-tg-text bg-slate-50 dark:bg-slate-900/60 py-1.5 px-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-tg-button" />
                    {format(new Date(app.dateTime), 'HH:mm')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-tg-text">{app.clientName}</div>
                    <div className="text-xs text-tg-hint flex items-center gap-1.5 mt-0.5">
                      <span>{app.service}</span>
                      <span>•</span>
                      <span className="flex items-center text-[10px]">
                        <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                        {app.location === 'HOME' ? 'Дом' : 'Салон'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-semibold text-tg-text">
                    {app.price} lei
                  </div>
                  <Link
                    href={`/appointments/${app.id}/edit`}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-tg-hint hover:text-tg-button rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
