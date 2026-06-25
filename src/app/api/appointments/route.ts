import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/appointments — получение списка записей с возможностью фильтрации по датам для текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Фильтруем записи по userId авторизованного пользователя
    const where: any = {
      userId: session.userId,
    };
    
    if (from && to) {
      where.dateTime = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        client: true, // Подтягиваем данные связанного клиента
      },
      orderBy: {
        dateTime: 'asc', // Сортируем от ранних к поздним
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Ошибка при получении записей:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/appointments — создание новой записи для текущего пользователя
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
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

    // Валидация обязательных полей
    if (!clientName || !service || !dateTime || price === undefined || !location || !status) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    const appointment = await db.appointment.create({
      data: {
        userId: session.userId,
        clientId: clientId || null,
        clientName,
        clientPhone,
        service,
        dateTime: new Date(dateTime),
        price: Number(price),
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
    console.error('Ошибка при создании записи:', error);
    return NextResponse.json({ error: 'Ошибка при сохранении в базу данных' }, { status: 500 });
  }
}
