import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/appointments/[id] — получение данных одной записи
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;

    // Ищем запись с учетом userId
    const appointment = await db.appointment.findFirst({
      where: { id, userId: session.userId },
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем принадлежность записи пользователю
    const existing = await db.appointment.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена или доступ запрещен' }, { status: 404 });
    }

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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем принадлежность записи пользователю
    const existing = await db.appointment.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена или доступ запрещен' }, { status: 404 });
    }

    await db.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера при удалении записи' }, { status: 500 });
  }
}
