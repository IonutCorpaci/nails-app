import { Suspense } from 'react';
import AppointmentForm from '@/components/AppointmentForm';

// Страница создания новой записи.
// Мы оборачиваем форму в Suspense, так как компонент AppointmentForm 
// использует хук useSearchParams (для получения переданной даты из календаря).
// В Next.js 15 использование useSearchParams на верхнем уровне требует Suspense
// для корректного статического анализа и оптимизации во время сборки.
export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-sm text-tg-hint">Загрузка формы...</div>}>
      <AppointmentForm />
    </Suspense>
  );
}
