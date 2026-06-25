import 'dotenv/config';
import { db } from '../src/lib/db';

async function main() {
  try {
    const firstUser = await db.user.findFirst();
    if (!firstUser) {
      console.log('--------------------------------------------------');
      console.log('Пожалуйста, сначала зарегистрируйте пользователя (например, маму) через интерфейс веб-приложения!');
      console.log('После этого запустите этот скрипт повторно, чтобы связать старые данные с её профилем.');
      console.log('--------------------------------------------------');
      return;
    }

    const clientsToMigrate = await db.client.count({
      where: { userId: null },
    });

    const appointmentsToMigrate = await db.appointment.count({
      where: { userId: null },
    });

    if (clientsToMigrate === 0 && appointmentsToMigrate === 0) {
      console.log('Все записи и клиенты уже привязаны к пользователям.');
      return;
    }

    console.log(`Найдено клиентов без владельца: ${clientsToMigrate}`);
    console.log(`Найдено записей без владельца: ${appointmentsToMigrate}`);
    console.log(`Привязываем их к пользователю: ${firstUser.name} (${firstUser.username})`);

    const updatedClients = await db.client.updateMany({
      where: { userId: null },
      data: { userId: firstUser.id },
    });

    const updatedAppointments = await db.appointment.updateMany({
      where: { userId: null },
      data: { userId: firstUser.id },
    });

    console.log(`Успешно привязано клиентов: ${updatedClients.count}`);
    console.log(`Успешно привязано записей: ${updatedAppointments.count}`);
  } catch (err) {
    console.error('Ошибка миграции данных:', err);
  } finally {
    await db.$disconnect();
  }
}

main();
