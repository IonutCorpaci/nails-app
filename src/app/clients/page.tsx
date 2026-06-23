'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Phone, MessageSquare, ChevronRight, User, Plus, X } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
}

// Хелпер для извлечения инициалов клиента (для красивых аватарок)
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Страница списка клиентов (справочник мастера)
export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Состояния для быстрого добавления нового клиента (инлайн-форма)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClients = async (query = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients?q=${encodeURIComponent(query)}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Дебаунс для поиска клиентов
    const delayDebounce = setTimeout(() => {
      fetchClients(searchQuery);
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Добавление клиента
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone || null,
          notes: newNotes || null,
        }),
      });

      if (response.ok) {
        const newClient = await response.json();
        setClients((prev) => [newClient, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Сброс формы
        setNewName('');
        setNewPhone('');
        setNewNotes('');
        setShowAddForm(false);
      } else {
        alert('Не удалось сохранить клиента');
      }
    } catch (error) {
      console.error('Ошибка добавления клиента:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-tg-text flex items-center gap-2">
            <User className="w-5 h-5 text-tg-button" /> База клиентов
          </h1>
          <p className="text-xs text-tg-hint mt-0.5">Список твоих постоянных гостей</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
            showAddForm
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
              : 'bg-tg-button text-tg-button-text'
          }`}
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4" /> Закрыть
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Добавить
            </>
          )}
        </button>
      </div>

      {/* Инлайн-форма быстрого создания клиента */}
      {showAddForm && (
        <form
          onSubmit={handleAddClient}
          className="bg-tg-secondary-bg p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-md space-y-3 animate-in slide-in-from-top duration-200"
        >
          <h3 className="font-semibold text-sm text-tg-text">Новый клиент</h3>
          <div className="space-y-2">
            <input
              type="text"
              required
              placeholder="ФИО или Имя *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs focus:outline-none focus:border-tg-button text-tg-text"
            />
            <input
              type="tel"
              placeholder="Телефон (например, +37360123456)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs focus:outline-none focus:border-tg-button text-tg-text"
            />
            <textarea
              placeholder="Заметки о ногтях (форма, длина, любимые цвета, аллергии...)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs focus:outline-none focus:border-tg-button text-tg-text"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-tg-button text-tg-button-text text-xs font-bold py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Сохранение...' : 'Создать карточку клиента'}
          </button>
        </form>
      )}

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tg-hint" />
        <input
          type="text"
          placeholder="Поиск по имени или телефону..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-tg-secondary-bg border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-base sm:text-sm focus:outline-none focus:border-tg-button text-tg-text shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
        />
      </div>

      {/* Список клиентов */}
      {loading && clients.length === 0 ? (
        <div className="text-center py-6 text-xs text-tg-hint">Загрузка справочника...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 bg-tg-secondary-bg border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-sm text-tg-hint">
          {searchQuery ? 'Никто не найден по твоему запросу' : 'База клиентов пока пуста.'}
        </div>
      ) : (
        <div className="bg-tg-secondary-bg rounded-2xl border border-slate-100 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => router.push(`/clients/${client.id}`)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-950/40 text-tg-button font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                  {getInitials(client.name)}
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm text-tg-text group-hover:text-tg-button transition-colors">
                    {client.name}
                  </div>
                  {client.phone && (
                    <div className="text-xs text-tg-text/65 flex items-center font-medium">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Быстрые контакты */}
                {client.phone && (
                  <>
                    <a
                      href={`tel:${client.phone}`}
                      onClick={(e) => e.stopPropagation()} // Исключаем переход по ссылке карточки
                      className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-tg-button rounded-xl transition-colors"
                      title="Позвонить"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
                
                <ChevronRight className="w-4 h-4 text-tg-hint group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
