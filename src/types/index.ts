import { Client, Appointment } from '@/generated/prisma/client';

// Описываем расширенные типы данных для удобства использования по всему приложению.
// Мы наследуем их от автогенерируемых типов Prisma.

export type ClientWithAppointments = Client & {
  appointments: Appointment[];
};

export type AppointmentWithClient = Appointment & {
  client: Client | null;
};
