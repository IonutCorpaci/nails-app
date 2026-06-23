import { db as prisma } from '../src/lib/db';

async function main() {
  console.log('Очистка базы данных...');
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();

  console.log('Создание тестовых клиентов...');
  const client1 = await prisma.client.create({
    data: {
      name: 'Елена Смирнова',
      phone: '+79991112233',
      notes: 'Форма ногтей: миндаль. Предпочитает нюдовые оттенки и френч. Чувствительная кутикула, требуется аккуратность.',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Мария Иванова',
      phone: '+79992223344',
      notes: 'Форма ногтей: мягкий квадрат. Любит яркие неоновые цвета и стемпинг на безымянных пальцах.',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Анна Кузнецова',
      phone: '+79993334455',
      notes: 'Наращивание ногтей гелем. Длина 3. Дизайн выбирает на месте, любит блестки.',
    },
  });

  console.log('Создание тестовых записей...');
  const today = new Date();

  // 1. Запись на сегодня утром (Выполнена)
  const appTodayMorning = new Date(today);
  appTodayMorning.setHours(10, 0, 0, 0);
  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      clientName: client1.name,
      clientPhone: client1.phone,
      service: 'Маникюр + гель-лак',
      dateTime: appTodayMorning,
      price: 1800,
      location: 'SALON',
      status: 'COMPLETED',
      notes: 'База с шиммером, дизайн фольгой на двух ногтях.',
    },
  });

  // 2. Запись на сегодня днем (Запланирована)
  const appTodayAfternoon = new Date(today);
  appTodayAfternoon.setHours(14, 30, 0, 0);
  await prisma.appointment.create({
    data: {
      clientId: client2.id,
      clientName: client2.name,
      clientPhone: client2.phone,
      service: 'Маникюр + гель-лак + дизайн',
      dateTime: appTodayAfternoon,
      price: 2200,
      location: 'HOME',
      status: 'PLANNED',
      notes: 'Будем пробовать новый неоновый розовый топ.',
    },
  });

  // 3. Запись на завтра (Запланирована)
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const appTomorrow = new Date(tomorrow);
  appTomorrow.setHours(12, 0, 0, 0);
  await prisma.appointment.create({
    data: {
      clientId: client3.id,
      clientName: client3.name,
      clientPhone: client3.phone,
      service: 'Наращивание ногтей',
      dateTime: appTomorrow,
      price: 3200,
      location: 'SALON',
      status: 'PLANNED',
      notes: 'Ремонт одного сломанного свободного края.',
    },
  });

  // 4. Запись в прошлом (Выполнена)
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 7); // неделю назад
  const appPast = new Date(yesterday);
  appPast.setHours(16, 0, 0, 0);
  await prisma.appointment.create({
    data: {
      clientId: client1.id,
      clientName: client1.name,
      clientPhone: client1.phone,
      service: 'Снятие покрытия + укрепление акрилом',
      dateTime: appPast,
      price: 1000,
      location: 'HOME',
      status: 'COMPLETED',
      notes: 'Было сильное отслоение на указательном пальце.',
    },
  });

  console.log('База данных успешно заполнена тестовыми данными!');
}

main()
  .catch((e) => {
    console.error('Ошибка сидинга БД:', e);
    process.exit(1);
  });
