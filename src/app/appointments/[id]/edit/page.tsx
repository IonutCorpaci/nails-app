import { Suspense } from 'react';
import AppointmentForm from '@/components/AppointmentForm';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

// Страница редактирования записи.
// Параметр id извлекается из параметров URL. В Next.js 15 params является промисом, 
// поэтому мы используем async-await для его извлечения.
export default async function EditAppointmentPage({ params }: EditPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="text-center py-10 text-sm text-tg-hint">Загрузка формы...</div>}>
      <AppointmentForm appointmentId={id} />
    </Suspense>
  );
}
