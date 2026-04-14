import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const worker = new Worker(
  'notifications',
  async (job) => {
    const { userId, scheduleId } = job.data;

    // busca dados reais
    const schedule = await prisma.routeSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: true,
      },
    });

    if (!schedule) return;

    let message = '';

    switch (schedule.type) {
      case 'GO':
        message = 'Você vai hoje com o ônibus?';
        break;
      case 'BACK':
        message = 'Você vai embora com o ônibus hoje?';
        break;
      case 'SHIFT':
        message = 'Você irá no turno hoje?';
        break;
    }

    console.log(`📲 Enviando para ${userId}: ${message}`);

    // FUTURO:
    // Firebase
    // WebSocket
    // WhatsApp API
  },
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  },
);

worker.on('completed', (job) => {
  console.log(`✅ Job concluído: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job falhou: ${job?.id}`, err);
});
