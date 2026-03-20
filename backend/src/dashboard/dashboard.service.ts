import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Quantidade de alunos ativos
    const activeStudents = await this.prisma.student.count({
      where: { companyId, active: true },
    });

    // Quantidade de RFIDs lidos hoje (boarding events)
    const rfidReads = await this.prisma.transportEvent.count({
      where: {
        companyId,
        type: 'BOARDING',
        createdAt: { gte: today },
      },
    });

    // Quantidade de trips hoje
    const tripsToday = await this.prisma.trip.count({
      where: { companyId, startedAt: { gte: today } },
    });

    // Capacidade de ônibus utilizada hoje
    const buses = await this.prisma.bus.findMany({
      where: { companyId },
      include: {
        trips: {
          where: { startedAt: { gte: today } },
          include: { transportEvents: true },
        },
      },
    });

    const busCapacityUsed = buses.reduce((acc, bus) => {
      const totalBoarded = bus.trips.reduce(
        (sum, trip) => sum + trip.transportEvents.length,
        0,
      );
      return acc + totalBoarded;
    }, 0);

    // Dados para gráficos
    const boardings = await this.prisma.transportEvent.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { companyId, type: 'BOARDING', createdAt: { gte: today } },
    });

    const trips = await this.prisma.trip.groupBy({
      by: ['startedAt'],
      _count: { id: true },
      where: { companyId, startedAt: { gte: today } },
    });

    // Formata datas para frontend
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return {
      activeStudents,
      rfidReads,
      tripsToday,
      busCapacityUsed,
      charts: await this.getChartData(companyId),
    };
  }
  async getChartData(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Últimos 7 dias
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const boardings: { date: string; count: number }[] = [];
    const trips: { date: string; count: number }[] = [];

    for (const day of days) {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const boardingsCount = await this.prisma.transportEvent.count({
        where: {
          companyId,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const tripsCount = await this.prisma.trip.count({
        where: {
          companyId,
          startedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      boardings.push({
        date: day.toISOString().split('T')[0],
        count: boardingsCount,
      });
      trips.push({ date: day.toISOString().split('T')[0], count: tripsCount });
    }

    return { boardings, trips };
  }
}
