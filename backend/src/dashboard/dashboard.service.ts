import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // --- ALUNOS ---
    const activeStudents = await this.prisma.student.count({
      where: { companyId, active: true },
    });

    const activeStudentsYesterday = await this.prisma.student.count({
      where: { companyId, active: true, createdAt: { lte: yesterday } },
    });

    const changeStudents = activeStudents - activeStudentsYesterday;
    const trendStudents = changeStudents >= 0 ? 'up' : 'down';

    // --- RFIDs ---
    const rfidReads = await this.prisma.transportEvent.count({
      where: { companyId, type: 'BOARDING', createdAt: { gte: today } },
    });

    const rfidReadsYesterday = await this.prisma.transportEvent.count({
      where: {
        companyId,
        type: 'BOARDING',
        createdAt: {
          gte: yesterday,
          lte: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        },
      },
    });

    const changeRfid = rfidReads - rfidReadsYesterday;
    const trendRfid = changeRfid >= 0 ? 'up' : 'down';

    // --- VIAGENS ---
    const tripsToday = await this.prisma.trip.count({
      where: { companyId, startedAt: { gte: today } },
    });

    const tripsYesterday = await this.prisma.trip.count({
      where: {
        companyId,
        startedAt: {
          gte: yesterday,
          lte: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        },
      },
    });

    const changeTrips = tripsToday - tripsYesterday;
    const trendTrips = changeTrips >= 0 ? 'up' : 'down';

    // --- ÔNIBUS EM OPERAÇÃO ---
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

    // Para trend e change, podemos comparar com ontem
    const busesYesterday = await this.prisma.bus.findMany({
      where: { companyId },
      include: {
        trips: {
          where: {
            startedAt: {
              gte: yesterday,
              lte: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
            },
          },
          include: { transportEvents: true },
        },
      },
    });

    const busCapacityYesterday = busesYesterday.reduce((acc, bus) => {
      const totalBoarded = bus.trips.reduce(
        (sum, trip) => sum + trip.transportEvents.length,
        0,
      );
      return acc + totalBoarded;
    }, 0);

    const changeBuses = busCapacityUsed - busCapacityYesterday;
    const trendBuses = changeBuses >= 0 ? 'up' : 'down';

    // --- GRÁFICOS ---
    const charts = await this.getChartData(companyId);

    return {
      activeStudents,
      rfidReads,
      tripsToday,
      busCapacityUsed,
      changeStudents,
      trendStudents,
      changeRfid,
      trendRfid,
      changeTrips,
      trendTrips,
      changeBuses,
      trendBuses,
      charts,
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
          type: 'BOARDING',
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const tripsCount = await this.prisma.trip.count({
        where: { companyId, startedAt: { gte: dayStart, lte: dayEnd } },
      });

      boardings.push({
        date: day.toISOString().split('T')[0], // 2026-03-20
        count: boardingsCount,
      });
      trips.push({ date: day.toISOString().split('T')[0], count: tripsCount });
    }

    return { boardings, trips };
  }
}
