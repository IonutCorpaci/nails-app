import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/clients/[id] — получение данных конкретного клиента вместе с историей визитов
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

    const client = await db.client.findFirst({
      where: { id, userId: session.userId },
      include: {
        appointments: {
          where: { userId: session.userId }, // Также фильтруем связанные записи
          orderBy: {
            dateTime: 'desc', // История визитов от новых к старым
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Ошибка при получении профиля клиента:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT /api/clients/[id] — обновление данных клиента (например, заметок или телефона)
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

    // Проверяем принадлежность
    const existing = await db.client.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Клиент не найден или доступ запрещен' }, { status: 404 });
    }

    const body = await request.json();
    const { name, phone, notes } = body;

    const client = await db.client.update({
      where: { id },
      data: {
        name,
        phone,
        notes,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Ошибка при обновлении профиля клиента:', error);
    return NextResponse.json({ error: 'Ошибка сервера при обновлении клиента' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] — удаление клиента и всей его истории (за счет Cascade Delete)
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

    // Проверяем принадлежность
    const existing = await db.client.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Клиент не найден или доступ запрещен' }, { status: 404 });
    }

    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении клиента:', error);
    return NextResponse.json({ error: 'Ошибка сервера при удалении клиента' }, { status: 500 });
  }
}
