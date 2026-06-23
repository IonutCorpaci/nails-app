'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Phone, Briefcase, Calendar, Clock, MapPin, DollarSign, FileText, Check, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Client {
  id: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
}

const SERVICE_TEMPLATES = [
  { name: 'Маникюр + гель-лак', price: 1800 },
  { name: 'Маникюр без покрытия', price: 1000 },
  { name: 'Педикюр + гель-лак', price: 2500 },
  { name: 'Наращивание ногтей', price: 3000 },
  { name: 'Снятие без покрытия', price: 400 },
];

interface AppointmentFormProps {
  appointmentId?: string; // Передаем, если это форма редактирования
}

export default function AppointmentForm({ appointmentId }: AppointmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Быстрые даты для кнопок быстрого выбора
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

  // Состояния полей формы
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState<'HOME' | 'SALON'>('HOME');
  const [status, setStatus] = useState<'PLANNED' | 'COMPLETED' | 'CANCELLED'>('PLANNED');
  const [notes, setNotes] = useState('');

  // Состояния для автодополнения клиентов
  const [clientsSuggestions, setClientsSuggestions] = useState<Client[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Состояния отправки и удаления
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Инициализация дефолтных значений
  useEffect(() => {
    // Закрываем выпадающий список автокомплита при клике снаружи
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    // Если есть параметр ?date в URL, подставим его (удобно при добавлении из календаря)
    const urlDateParam = searchParams.get('date');
    if (urlDateParam && !appointmentId) {
      const parsedDate = new Date(urlDateParam);
      setDate(format(parsedDate, 'yyyy-MM-dd'));
    } else if (!appointmentId) {
      // Иначе ставим сегодняшний день по умолчанию
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }

    // Если передан appointmentId, значит мы в режиме редактирования: загружаем запись из БД
    if (appointmentId) {
      const loadAppointment = async () => {
        try {
          const response = await fetch(`/api/appointments/${appointmentId}`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setClientId(data.clientId);
            setClientName(data.clientName);
            setClientPhone(data.clientPhone || '');
            setService(data.service);
            setPrice(data.price.toString());
            setLocation(data.location as 'HOME' | 'SALON');
            setStatus(data.status as 'PLANNED' | 'COMPLETED' | 'CANCELLED');
            setNotes(data.notes || '');
            
            const appDateTime = new Date(data.dateTime);
            setDate(format(appDateTime, 'yyyy-MM-dd'));
            setTime(format(appDateTime, 'HH:mm'));
          }
        } catch (error) {
          console.error('Ошибка загрузки записи:', error);
        }
      };
      loadAppointment();
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [appointmentId, searchParams]);

  // Запрос автодополнения клиентов при изменении имени
  useEffect(() => {
    if (clientName.length < 2 || clientId) {
      setClientsSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/clients?q=${encodeURIComponent(clientName)}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Показываем только если имя не совпадает на 100% с уже выбранным
          setClientsSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error('Ошибка поиска клиентов:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // Дебаунс 300мс для снижения нагрузки на БД

    return () => clearTimeout(delayDebounce);
  }, [clientName, clientId]);

  // Обработка выбора существующего клиента из списка
  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientName(client.name);
    setClientPhone(client.phone || '');
    setClientsSuggestions([]);
    setShowSuggestions(false);
  };

  // Сброс привязки клиента, если пользователь стер или изменил имя вручную
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
    if (clientId) {
      setClientId(null); // Отвязываем клиента от ID
    }
  };

  // Сохранение формы (создание или обновление)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !service || !date || !time || !price) {
      alert('Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setIsSubmitting(true);

    const dateTimeStr = `${date}T${time}:00`;
    const payload = {
      clientId,
      clientName,
      clientPhone: clientPhone || null,
      service,
      dateTime: new Date(dateTimeStr).toISOString(),
      price: parseFloat(price),
      location,
      status,
      notes: notes || null,
    };

    try {
      const url = appointmentId ? `/api/appointments/${appointmentId}` : '/api/appointments';
      const method = appointmentId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('Произошла ошибка при отправке запроса');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Удаление записи
  const handleDelete = async () => {
    if (!appointmentId) return;
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Ошибка удаления записи:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Кнопка "Назад" */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-tg-hint font-medium hover:text-tg-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-tg-text">
          {appointmentId ? 'Редактировать запись' : 'Новая запись'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Поле Имя клиента (с автокомплитом) */}
        <div className="space-y-1 relative" ref={autocompleteRef}>
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <User className="w-3.5 h-3.5 mr-1 text-tg-button" /> Имя клиента *
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={handleNameChange}
            placeholder="Введите имя клиента..."
            className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
          />
          {/* Выпадающий список автозаполнения */}
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {clientsSuggestions.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-slate-50 dark:border-slate-800 last:border-0 text-tg-text flex justify-between"
                >
                  <span className="font-semibold">{client.name}</span>
                  {client.phone && <span className="text-xs text-tg-hint">{client.phone}</span>}
                </button>
              ))}
            </div>
          )}
          {clientId && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
              ✓ Выбран существующий клиент из базы
            </span>
          )}
        </div>

        {/* Телефон */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <Phone className="w-3.5 h-3.5 mr-1 text-tg-button" /> Номер телефона
          </label>
          <input
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+373 (60) 123-456"
            className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
          />
        </div>

        {/* Услуга */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <Briefcase className="w-3.5 h-3.5 mr-1 text-tg-button" /> Название услуги *
          </label>
          {/* Быстрые плитки-шаблоны */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {SERVICE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => {
                  setService(tmpl.name);
                  setPrice(tmpl.price.toString());
                }}
                className="text-[10px] sm:text-xs bg-pink-50 hover:bg-pink-100 text-tg-button dark:bg-pink-950/20 dark:hover:bg-pink-950/40 border border-pink-100 dark:border-pink-900/30 px-2.5 py-1 rounded-full font-medium transition-all"
              >
                {tmpl.name} ({tmpl.price} lei)
              </button>
            ))}
          </div>
          <input
            type="text"
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Например: Маникюр + гель-лак"
            className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
          />
        </div>

        {/* Дата и Время */}
        <div className="space-y-3">
          {/* Быстрые кнопки дат с выделением активного выбора */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-tg-hint flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-tg-button" /> Быстрый выбор даты
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 border cursor-pointer text-center ${
                  date === todayStr
                    ? 'bg-tg-button text-tg-button-text border-tg-button shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => setDate(tomorrowStr)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 border cursor-pointer text-center ${
                  date === tomorrowStr
                    ? 'bg-tg-button text-tg-button-text border-tg-button shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Завтра
              </button>
            </div>
          </div>

          {/* Поле выбора Даты */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-tg-hint flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-tg-button" /> Дата записи *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
            />
          </div>

          {/* Поле выбора Времени */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-tg-hint flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-tg-button" /> Время записи *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
            />
          </div>
        </div>

        {/* Стоимость */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <DollarSign className="w-3.5 h-3.5 mr-1 text-tg-button" /> Стоимость (lei) *
          </label>
          <input
            type="number"
            required
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="1500"
            className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
          />
        </div>

        {/* Локация (Segmented Control) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-tg-button" /> Место проведения *
          </label>
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setLocation('HOME')}
              className={`py-2.5 text-center text-xs font-semibold rounded-xl transition-all ${
                location === 'HOME'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-tg-hint hover:text-tg-text'
              }`}
            >
              Дома
            </button>
            <button
              type="button"
              onClick={() => setLocation('SALON')}
              className={`py-2.5 text-center text-xs font-semibold rounded-xl transition-all ${
                location === 'SALON'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-tg-hint hover:text-tg-text'
              }`}
            >
              В салоне
            </button>
          </div>
        </div>

        {/* Статус записи (Segmented Control) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <Check className="w-3.5 h-3.5 mr-1 text-tg-button" /> Статус записи *
          </label>
          <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setStatus('PLANNED')}
              className={`py-2.5 text-center text-[10px] sm:text-xs font-bold rounded-xl transition-all truncate px-1 ${
                status === 'PLANNED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-tg-hint hover:text-tg-text'
              }`}
            >
              Ожидается
            </button>
            <button
              type="button"
              onClick={() => setStatus('COMPLETED')}
              className={`py-2.5 text-center text-[10px] sm:text-xs font-bold rounded-xl transition-all truncate px-1 ${
                status === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-tg-hint hover:text-tg-text'
              }`}
            >
              Выполнена
            </button>
            <button
              type="button"
              onClick={() => setStatus('CANCELLED')}
              className={`py-2.5 text-center text-[10px] sm:text-xs font-bold rounded-xl transition-all truncate px-1 ${
                status === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-tg-hint hover:text-tg-text'
              }`}
            >
              Отменена
            </button>
          </div>
        </div>

        {/* Заметки */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-tg-hint flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-tg-button" /> Заметка к записи
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Особые пожелания, цвета, дизайн, аллергии..."
            rows={3}
            className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text"
          />
        </div>

        {/* Кнопка отправки формы */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm mt-6 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Сохранение...' : appointmentId ? 'Сохранить изменения' : 'Создать запись'}
        </button>

        {/* Кнопка удаления записи */}
        {appointmentId && (
          <div className="pt-2">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold py-3 rounded-xl border border-rose-100 dark:border-rose-950 flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Удалить запись
              </button>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950 p-4 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-400 text-center">
                  Вы действительно хотите безвозвратно удалить эту запись?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Да, удалить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-tg-text font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
