import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// В Next.js App Router API-эндпоинты пишутся в файлах route.ts.
// Мы определяем асинхронные функции с именами HTTP-методов (GET, POST и т.д.).

// GET /api/appointments — получение списка записей с возможностью фильтрации по датам
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Формируем условие фильтрации. Если переданы даты "от" и "до", фильтруем по ним.
    const where: any = {};
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

// POST /api/appointments — создание новой записи
export async function POST(request: NextRequest) {
  try {
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
