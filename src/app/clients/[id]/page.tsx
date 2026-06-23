'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Phone, Calendar, ClipboardList, Clock, 
  MapPin, Edit3, Save, Check, X, Award, TrendingUp, AlertCircle, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Appointment {
  id: string;
  service: string;
  dateTime: string;
  price: number;
  location: string;
  status: string;
  notes?: string | null;
}

interface ClientDetail {
  id: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
  appointments: Appointment[];
}

// Карточка клиента: подробный профиль, статистика посещений, история визитов и заметки.
export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Состояния для inline-редактирования заметок
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  // Состояния для inline-редактирования личных данных (Имя, Телефон)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClient(data);
        setNotesDraft(data.notes || '');
        setNameDraft(data.name);
        setPhoneDraft(data.phone || '');
      } else {
        alert('Клиент не найден');
        router.push('/clients');
      }
    } catch (error) {
      console.error('Ошибка загрузки данных клиента:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientDetails();
    }
  }, [id]);

  // Сохранение изменений в БД
  const handleSaveProfile = async (fieldUpdate: Record<string, any>) => {
    setIsSaving(true);
    try {
      const payload = {
        name: nameDraft,
        phone: phoneDraft || null,
        notes: notesDraft || null,
        ...fieldUpdate, // Подмешиваем измененное поле
      };

      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = await response.json();
        setClient((prev) => prev ? { ...prev, ...updated } : null);
        setIsEditingNotes(false);
        setIsEditingProfile(false);
      } else {
        alert('Не удалось обновить данные клиента');
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !client) {
    return <div className="text-center py-12 text-xs text-tg-hint">Загрузка профиля...</div>;
  }

  if (!client) return null;

  // Аналитика на основе истории визитов
  const completedVisits = client.appointments.filter(app => app.status === 'COMPLETED');
  const totalVisitsCount = completedVisits.length;
  const totalSpent = completedVisits.reduce((sum, app) => sum + app.price, 0);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'В планах';
      case 'COMPLETED':
        return 'Выполнена';
      case 'CANCELLED':
        return 'Отменена';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Кнопка назад */}
      <button
        onClick={() => router.push('/clients')}
        className="flex items-center gap-1.5 text-sm text-tg-hint font-medium hover:text-tg-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </button>

      {/* Карточка профиля клиента */}
      <div className="bg-tg-secondary-bg rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        {!isEditingProfile ? (
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-tg-text">{client.name}</h1>
              {client.phone ? (
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-tg-button font-bold flex items-center hover:underline mt-1"
                >
                  <Phone className="w-4 h-4 mr-1.5" /> {client.phone}
                </a>
              ) : (
                <span className="text-sm text-tg-text/50 italic mt-1 block font-medium">Телефон не указан</span>
              )}
            </div>
            
            <button
              onClick={() => setIsEditingProfile(true)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-tg-hint hover:text-tg-button rounded-xl transition-all"
              title="Редактировать профиль"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-tg-hint uppercase">Редактировать контакты</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs focus:outline-none focus:border-tg-button text-tg-text font-semibold"
                placeholder="Имя клиента *"
              />
              <input
                type="tel"
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs focus:outline-none focus:border-tg-button text-tg-text"
                placeholder="Номер телефона"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setNameDraft(client.name);
                  setPhoneDraft(client.phone || '');
                  setIsEditingProfile(false);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-tg-text text-[10px] sm:text-xs font-bold rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleSaveProfile({ name: nameDraft, phone: phoneDraft || null })}
                disabled={isSaving}
                className="px-3 py-1.5 bg-tg-button text-tg-button-text text-[10px] sm:text-xs font-bold rounded-lg transition-all"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}

        {/* Быстрые контакты */}
        {client.phone && (
          <div className="flex flex-col gap-2 pt-2">
            <a
              href={`tel:${client.phone}`}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-tg-text text-sm py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <Phone className="w-4 h-4 text-tg-button" /> Позвонить по телефону
            </a>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs py-3 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-100 dark:border-emerald-950"
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp
              </a>
              <a
                href={`https://t.me/+${client.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-xs py-3 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border border-sky-100 dark:border-sky-950"
              >
                <MessageSquare className="w-4 h-4 text-sky-500" /> Telegram
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Статистика визитов */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-tg-secondary-bg p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_1px_4px_rgba(0,0,0,0.01)] flex items-center space-x-3">
          <div className="p-2.5 bg-pink-50 dark:bg-pink-950/20 text-tg-button rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-tg-text/65 uppercase font-bold tracking-wide">Визитов всего</div>
            <div className="text-xl font-extrabold text-tg-text mt-0.5">{totalVisitsCount}</div>
          </div>
        </div>
        
        <div className="bg-tg-secondary-bg p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-[0_1px_4px_rgba(0,0,0,0.01)] flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-tg-text/65 uppercase font-bold tracking-wide">Общая выручка</div>
            <div className="text-xl font-extrabold text-tg-text mt-0.5">{totalSpent} lei</div>
          </div>
        </div>
      </div>

      {/* Заметки о предпочтениях ногтей */}
      <div className="bg-tg-secondary-bg rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-tg-text flex items-center">
            <ClipboardList className="w-4 h-4 mr-1.5 text-tg-button" /> Особенности и дизайн
          </h2>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-tg-button font-semibold"
            >
              Изменить
            </button>
          )}
        </div>

        {!isEditingNotes ? (
          client.notes ? (
            <p className="text-sm text-tg-text/90 leading-relaxed font-medium whitespace-pre-wrap">{client.notes}</p>
          ) : (
            <p className="text-sm text-tg-text/50 italic leading-relaxed">
              Нет записей. Мастер может добавить особенности ногтей клиента (например: чувствительная кутикула, предпочитает овал, любит розовые оттенки).
            </p>
          )
        ) : (
          <div className="space-y-3">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Форма, длина ногтей, особенности кожи, любимый цвет..."
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-base sm:text-xs focus:outline-none focus:border-tg-button text-tg-text leading-relaxed"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setNotesDraft(client.notes || '');
                  setIsEditingNotes(false);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-tg-text text-[10px] sm:text-xs font-bold rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleSaveProfile({ notes: notesDraft || null })}
                disabled={isSaving}
                className="px-3 py-1.5 bg-tg-button text-tg-button-text text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* История записей */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-tg-text">История посещений ({client.appointments.length})</h2>
        {client.appointments.length === 0 ? (
          <div className="text-center py-8 bg-tg-secondary-bg border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-xs text-tg-hint">
            Записей у этого клиента еще не было.
          </div>
        ) : (
          <div className="space-y-2">
            {client.appointments.map((app) => (
              <div
                key={app.id}
                className="bg-tg-secondary-bg rounded-xl p-3.5 border border-slate-100 dark:border-slate-800/60 shadow-[0_1px_4px_rgba(0,0,0,0.01)] flex flex-col space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-xs font-bold text-tg-text">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-tg-button" />
                    {format(new Date(app.dateTime), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${getStatusBadgeClass(app.status)}`}>
                    {getStatusText(app.status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-start text-sm mt-1">
                  <div>
                    <div className="font-bold text-tg-text">{app.service}</div>
                    <div className="text-xs text-tg-text/70 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {app.location === 'HOME' ? 'Дома' : 'В салоне'}
                    </div>
                  </div>
                  <div className="font-extrabold text-tg-text text-base whitespace-nowrap pl-2">
                    {app.price} lei
                  </div>
                </div>

                {app.notes && (
                  <div className="text-xs text-tg-text/80 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg flex items-start mt-2">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span>{app.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
