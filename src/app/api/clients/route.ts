import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/clients — получение списка клиентов с возможностью текстового поиска для текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const clients = await db.client.findMany({
      where: {
        userId: session.userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        name: 'asc', // Сортируем клиентов по алфавиту
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Ошибка при получении списка клиентов:', error);
    return NextResponse.json({ error: 'Ошибка сервера при получении списка клиентов' }, { status: 500 });
  }
}

// POST /api/clients — создание нового клиента (карточки клиента) для текущего пользователя
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Имя клиента является обязательным полем' }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        userId: session.userId,
        name,
        phone,
        notes,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Ошибка при создании клиента:', error);
    return NextResponse.json({ error: 'Ошибка сервера при создании клиента' }, { status: 500 });
  }
}
