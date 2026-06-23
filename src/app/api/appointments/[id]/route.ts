import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/appointments/[id] — получение данных одной записи
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Ошибка при получении записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера при получении записи' }, { status: 500 });
  }
}

// PUT /api/appointments/[id] — обновление существующей записи
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В Next.js 15 параметры маршрута (params) являются асинхронными, поэтому мы должны вызвать await params.
    const { id } = await params;
    const body = await request.json();
    
    const {
      clientId,
      clientName,
      clientPhone,
      service,
      dateTime,
      price,
      location,
      status,
      notes,
    } = body;

    const appointment = await db.appointment.update({
      where: { id },
      data: {
        clientId: clientId || null,
        clientName,
        clientPhone,
        service,
        dateTime: dateTime ? new Date(dateTime) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        location,
        status,
        notes,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Ошибка при обновлении записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера при обновлении записи' }, { status: 500 });
  }
}

// DELETE /api/appointments/[id] — удаление записи
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера при удалении записи' }, { status: 500 });
  }
}
