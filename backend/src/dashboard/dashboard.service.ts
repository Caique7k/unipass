import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addDaysToDateKey,
  getAppTimeZone,
  getZonedDateParts,
} from '../notifications/notification-time.util';
import {
  GetDashboardReportDto,
  type DashboardReportEventType,
  type DashboardReportStudentStatus,
  type DashboardReportType,
} from './dto/get-dashboard-report.dto';

type ReportFilterOption = {
  value: string;
  label: string;
};

type DashboardReportFilters = {
  reportType: DashboardReportType;
  startDate: string;
  endDate: string;
  busId: string | null;
  routeId: string | null;
  groupId: string | null;
  eventType: DashboardReportEventType;
  studentStatus: DashboardReportStudentStatus;
};

type DashboardReportCard = {
  id: DashboardReportType;
  label: string;
  description: string;
  category: 'operacao' | 'pessoas';
};

type DashboardSummaryCard = {
  label: string;
  value: string;
  helper: string;
};

type DashboardChartSeries = {
  key: string;
  label: string;
  color: string;
};

type DashboardChartDataPoint = {
  date: string;
} & Record<string, number | string>;

type DashboardReportTable = {
  title: string;
  description: string;
  columns: Array<{
    key: string;
    label: string;
  }>;
  rows: Array<{
    id: string;
    values: Record<string, string>;
  }>;
  emptyTitle: string;
  emptyDescription: string;
};

type DashboardReportPayload = {
  type: DashboardReportType;
  title: string;
  description: string;
  highlight: string;
  summaryCards: DashboardSummaryCard[];
  chart: {
    title: string;
    description: string;
    xKey: 'date';
    series: DashboardChartSeries[];
    data: DashboardChartDataPoint[];
  };
  table: DashboardReportTable;
};

type DashboardReportResponse = {
  generatedAt: string;
  availableReports: DashboardReportCard[];
  filters: DashboardReportFilters;
  options: {
    buses: ReportFilterOption[];
    routes: ReportFilterOption[];
    groups: ReportFilterOption[];
  };
  report: DashboardReportPayload;
};

const AVAILABLE_REPORTS: DashboardReportCard[] = [
  {
    id: 'boarding',
    label: 'Movimentacao',
    description:
      'Concentra embarques, desembarques e eventos negados para acompanhar o fluxo diario.',
    category: 'operacao',
  },
  {
    id: 'students',
    label: 'Frequencia dos alunos',
    description:
      'Resume presenca por aluno, dias com uso e o ultimo movimento registrado.',
    category: 'pessoas',
  },
  {
    id: 'fleet',
    label: 'Frota e operacao',
    description:
      'Mostra uso dos onibus, viagens registradas, dispositivos e volume de passageiros.',
    category: 'operacao',
  },
  {
    id: 'routes',
    label: 'Rotas',
    description:
      'Acompanha alunos vinculados, uso por rota e quais itinerarios tiveram movimentacao no periodo.',
    category: 'operacao',
  },
  {
    id: 'groups',
    label: 'Grupos',
    description:
      'Compara os grupos cadastrados pela empresa e identifica quais tiveram mais uso no transporte.',
    category: 'pessoas',
  },
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getMetrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const activeStudents = await this.prisma.student.count({
      where: { companyId, active: true },
    });

    const activeStudentsYesterday = await this.prisma.student.count({
      where: { companyId, active: true, createdAt: { lte: yesterday } },
    });

    const changeStudents = activeStudents - activeStudentsYesterday;
    const trendStudents = changeStudents >= 0 ? 'up' : 'down';

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
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
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
        date: day.toISOString().split('T')[0],
        count: boardingsCount,
      });
      trips.push({ date: day.toISOString().split('T')[0], count: tripsCount });
    }

    return { boardings, trips };
  }

  async getReport(
    companyId: string,
    query: GetDashboardReportDto,
  ): Promise<DashboardReportResponse> {
    const filters = this.normalizeReportFilters(query);

    const [options, report] = await Promise.all([
      this.getReportOptions(companyId),
      this.buildReport(companyId, filters),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      availableReports: AVAILABLE_REPORTS,
      filters,
      options,
      report,
    };
  }

  private async buildReport(
    companyId: string,
    filters: DashboardReportFilters,
  ): Promise<DashboardReportPayload> {
    if (filters.reportType === 'routes') {
      return this.buildRoutesReport(companyId, filters);
    }

    if (filters.reportType === 'groups') {
      return this.buildGroupsReport(companyId, filters);
    }

    if (filters.reportType === 'students') {
      return this.buildStudentsReport(companyId, filters);
    }

    if (filters.reportType === 'fleet') {
      return this.buildFleetReport(companyId, filters);
    }

    return this.buildBoardingReport(companyId, filters);
  }

  private async buildBoardingReport(
    companyId: string,
    filters: DashboardReportFilters,
  ): Promise<DashboardReportPayload> {
    const eventWhere: Prisma.TransportEventWhereInput = {
      companyId,
      createdAt: this.buildDateRange(filters.startDate, filters.endDate),
      ...(filters.busId ? { device: { busId: filters.busId } } : {}),
      ...(filters.eventType !== 'ALL' ? { type: filters.eventType } : {}),
      ...this.buildTransportEventStudentScope(filters),
    };

    const events = await this.prisma.transportEvent.findMany({
      where: eventWhere,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        createdAt: true,
        rfidCard: {
          select: {
            tag: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            registration: true,
            group: {
              select: {
                name: true,
              },
            },
            routes: {
              select: {
                route: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        device: {
          select: {
            name: true,
            code: true,
            bus: {
              select: {
                plate: true,
              },
            },
          },
        },
      },
    });

    const chart = this.createDailyChartData(filters.startDate, filters.endDate, {
      boardings: 0,
      deboardings: 0,
      denied: 0,
    });

    let boardings = 0;
    let deboardings = 0;
    let denied = 0;
    const uniqueStudents = new Set<string>();

    for (const event of events) {
      const dateKey = this.getDateKey(event.createdAt);
      const bucket = chart.index.get(dateKey);

      if (event.student?.id) {
        uniqueStudents.add(event.student.id);
      }

      if (event.type === 'BOARDING') {
        boardings += 1;
        bucket && (bucket.boardings += 1);
      } else if (event.type === 'DEBOARDING') {
        deboardings += 1;
        bucket && (bucket.deboardings += 1);
      } else if (event.type === 'DENIED') {
        denied += 1;
        bucket && (bucket.denied += 1);
      }
    }

    return {
      type: 'boarding',
      title: 'Relatorio de movimentacao',
      description:
        'Mostra os eventos operacionais do periodo com foco em embarques, desembarques e recusas.',
      highlight: this.formatPeriodLabel(filters.startDate, filters.endDate),
      summaryCards: [
        {
          label: 'Eventos no periodo',
          value: this.formatCount(events.length),
          helper: 'Soma de embarques, desembarques e negados.',
        },
        {
          label: 'Boardings',
          value: this.formatCount(boardings),
          helper: 'Registros autorizados de entrada.',
        },
        {
          label: 'Desembarques',
          value: this.formatCount(deboardings),
          helper: 'Saidas registradas no mesmo periodo.',
        },
        {
          label: 'Alunos unicos',
          value: this.formatCount(uniqueStudents.size),
          helper: 'Quantidade de alunos diferentes com evento.',
        },
      ],
      chart: {
        title: 'Volume por dia',
        description:
          'Distribuicao diaria para comparar o comportamento da operacao no periodo filtrado.',
        xKey: 'date',
        series: [
          { key: 'boardings', label: 'Boardings', color: '#ff8a4c' },
          { key: 'deboardings', label: 'Desembarques', color: '#f97316' },
          { key: 'denied', label: 'Negados', color: '#7c2d12' },
        ],
        data: chart.data,
      },
      table: {
        title: 'Eventos detalhados',
        description:
          'Lista cronologica reversa para auditoria operacional e conferencia pontual.',
        columns: [
          { key: 'datetime', label: 'Data e hora' },
          { key: 'type', label: 'Tipo' },
          { key: 'student', label: 'Aluno' },
          { key: 'group', label: 'Grupo' },
          { key: 'routes', label: 'Rotas' },
          { key: 'bus', label: 'Onibus' },
          { key: 'device', label: 'UniHub' },
        ],
        rows: events.map((event) => ({
          id: event.id,
          values: {
            datetime: this.formatDateTime(event.createdAt),
            type: this.formatEventType(event.type),
            student:
              event.student?.name ??
              (event.rfidCard?.tag ? `TAG ${event.rfidCard.tag}` : 'Nao identificado'),
            group: event.student?.group?.name ?? '--',
            routes:
              this.joinRouteNames(
                event.student?.routes.map((studentRoute) => studentRoute.route.name) ??
                  [],
              ) ?? '--',
            bus: event.device.bus?.plate ?? 'Sem onibus',
            device: event.device.name ?? event.device.code ?? 'UniHub',
          },
        })),
        emptyTitle: 'Nenhum evento encontrado',
        emptyDescription:
          'Ajuste o periodo ou remova filtros para visualizar a movimentacao.',
      },
    };
  }

  private async buildStudentsReport(
    companyId: string,
    filters: DashboardReportFilters,
  ): Promise<DashboardReportPayload> {
    const studentWhere: Prisma.StudentWhereInput = {
      companyId,
      ...this.buildStudentScope(filters),
    };

    const [students, events] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where: studentWhere,
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          registration: true,
          active: true,
          group: {
            select: {
              name: true,
            },
          },
          routes: {
            select: {
              route: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.transportEvent.findMany({
        where: {
          companyId,
          createdAt: this.buildDateRange(filters.startDate, filters.endDate),
          studentId: {
            not: null,
          },
          ...(filters.busId ? { device: { busId: filters.busId } } : {}),
          student: {
            ...this.buildStudentScope(filters),
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentId: true,
          type: true,
          createdAt: true,
          device: {
            select: {
              bus: {
                select: {
                  plate: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const chart = this.createDailyChartData(filters.startDate, filters.endDate, {
      activeStudents: 0,
      boardings: 0,
    });
    const chartStudentSets = new Map<string, Set<string>>();
    const eventsByStudent = new Map<
      string,
      {
        boardings: number;
        deboardings: number;
        denied: number;
        days: Set<string>;
        lastEventAt: Date | null;
        lastBusPlate: string | null;
      }
    >();

    for (const student of students) {
      eventsByStudent.set(student.id, {
        boardings: 0,
        deboardings: 0,
        denied: 0,
        days: new Set<string>(),
        lastEventAt: null,
        lastBusPlate: null,
      });
    }

    let totalBoardings = 0;

    for (const event of events) {
      if (!event.studentId) {
        continue;
      }

      const metrics = eventsByStudent.get(event.studentId);
      const dateKey = this.getDateKey(event.createdAt);
      const bucket = chart.index.get(dateKey);

      if (!metrics) {
        continue;
      }

      metrics.days.add(dateKey);
      metrics.lastEventAt = metrics.lastEventAt ?? event.createdAt;
      metrics.lastBusPlate =
        metrics.lastBusPlate ?? event.device.bus?.plate ?? 'Sem onibus';

      const studentSet = chartStudentSets.get(dateKey) ?? new Set<string>();
      studentSet.add(event.studentId);
      chartStudentSets.set(dateKey, studentSet);

      if (event.type === 'BOARDING') {
        metrics.boardings += 1;
        totalBoardings += 1;
        bucket && (bucket.boardings += 1);
      } else if (event.type === 'DEBOARDING') {
        metrics.deboardings += 1;
      } else if (event.type === 'DENIED') {
        metrics.denied += 1;
      }
    }

    for (const point of chart.data) {
      point.activeStudents = chartStudentSets.get(point.date)?.size ?? 0;
    }

    const studentsWithUsage = Array.from(eventsByStudent.values()).filter(
      (metrics) => metrics.boardings > 0 || metrics.deboardings > 0 || metrics.denied > 0,
    ).length;

    return {
      type: 'students',
      title: 'Relatorio de frequencia',
      description:
        'Resume o comportamento dos alunos no periodo e ajuda a identificar uso, ausencia e recorrencia.',
      highlight: this.formatPeriodLabel(filters.startDate, filters.endDate),
      summaryCards: [
        {
          label: 'Alunos filtrados',
          value: this.formatCount(students.length),
          helper: 'Base considerada apos aplicar os filtros.',
        },
        {
          label: 'Com movimentacao',
          value: this.formatCount(studentsWithUsage),
          helper: 'Alunos que tiveram ao menos um evento no periodo.',
        },
        {
          label: 'Sem movimentacao',
          value: this.formatCount(Math.max(0, students.length - studentsWithUsage)),
          helper: 'Ajuda a localizar ausencias ou falta de uso.',
        },
        {
          label: 'Media de boardings/aluno',
          value: this.formatDecimal(
            students.length > 0 ? totalBoardings / students.length : 0,
          ),
          helper: 'Taxa media considerando os alunos filtrados.',
        },
      ],
      chart: {
        title: 'Frequencia diaria',
        description:
          'Compara alunos ativos no periodo com o volume de boardings registrados por dia.',
        xKey: 'date',
        series: [
          { key: 'activeStudents', label: 'Alunos com uso', color: '#ffb27a' },
          { key: 'boardings', label: 'Boardings', color: '#ff5c00' },
        ],
        data: chart.data,
      },
      table: {
        title: 'Resumo por aluno',
        description:
          'Mostra situacao, recorrencia e ultimo ponto conhecido de movimentacao.',
        columns: [
          { key: 'student', label: 'Aluno' },
          { key: 'status', label: 'Status' },
          { key: 'group', label: 'Grupo' },
          { key: 'routes', label: 'Rotas' },
          { key: 'days', label: 'Dias com uso' },
          { key: 'boardings', label: 'Boardings' },
          { key: 'deboardings', label: 'Desembarques' },
          { key: 'lastEvent', label: 'Ultimo registro' },
          { key: 'lastBus', label: 'Ultimo onibus' },
        ],
        rows: students
          .map((student) => {
            const metrics = eventsByStudent.get(student.id);

            return {
              id: student.id,
              values: {
                student: `${student.name} (${student.registration})`,
                status: student.active ? 'Ativo' : 'Inativo',
                group: student.group?.name ?? '--',
                routes:
                  this.joinRouteNames(
                    student.routes.map((studentRoute) => studentRoute.route.name),
                  ) ?? '--',
                days: this.formatCount(metrics?.days.size ?? 0),
                boardings: this.formatCount(metrics?.boardings ?? 0),
                deboardings: this.formatCount(metrics?.deboardings ?? 0),
                lastEvent: metrics?.lastEventAt
                  ? this.formatDateTime(metrics.lastEventAt)
                  : '--',
                lastBus: metrics?.lastBusPlate ?? '--',
              },
              sortBoardings: metrics?.boardings ?? 0,
              sortDays: metrics?.days.size ?? 0,
            };
          })
          .sort((left, right) => {
            if (right.sortBoardings !== left.sortBoardings) {
              return right.sortBoardings - left.sortBoardings;
            }

            if (right.sortDays !== left.sortDays) {
              return right.sortDays - left.sortDays;
            }

            return left.values.student.localeCompare(right.values.student);
          })
          .map(({ id, values }) => ({ id, values })),
        emptyTitle: 'Nenhum aluno encontrado',
        emptyDescription:
          'Revise os filtros de grupo, rota ou status para montar a base do relatorio.',
      },
    };
  }

  private async buildFleetReport(
    companyId: string,
    filters: DashboardReportFilters,
  ): Promise<DashboardReportPayload> {
    const [buses, events, trips] = await this.prisma.$transaction([
      this.prisma.bus.findMany({
        where: {
          companyId,
          ...(filters.busId ? { id: filters.busId } : {}),
          ...(filters.routeId
            ? {
                OR: [
                  {
                    schedules: {
                      some: {
                        routeId: filters.routeId,
                      },
                    },
                  },
                  {
                    devices: {
                      some: {
                        transportEvents: {
                          some: {
                            createdAt: this.buildDateRange(
                              filters.startDate,
                              filters.endDate,
                            ),
                          },
                        },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: {
          plate: 'asc',
        },
        select: {
          id: true,
          plate: true,
          capacity: true,
          devices: {
            select: {
              id: true,
              name: true,
              code: true,
              active: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          schedules: {
            select: {
              route: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.transportEvent.findMany({
        where: {
          companyId,
          createdAt: this.buildDateRange(filters.startDate, filters.endDate),
          device: {
            busId: {
              not: null,
              ...(filters.busId ? { equals: filters.busId } : {}),
            },
          },
          ...this.buildTransportEventStudentScope(filters),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          createdAt: true,
          studentId: true,
          device: {
            select: {
              name: true,
              code: true,
              bus: {
                select: {
                  id: true,
                  plate: true,
                  capacity: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.trip.findMany({
        where: {
          companyId,
          startedAt: this.buildDateRange(filters.startDate, filters.endDate),
          busId: {
            not: null,
            ...(filters.busId ? { equals: filters.busId } : {}),
          },
          ...(filters.routeId
            ? {
                bus: {
                  schedules: {
                    some: {
                      routeId: filters.routeId,
                    },
                  },
                },
              }
            : {}),
        },
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          startedAt: true,
          busId: true,
        },
      }),
    ]);

    const busMap = new Map<
      string,
      {
        id: string;
        plate: string;
        capacity: number;
        deviceNames: string[];
        routeNames: string[];
        trips: number;
        boardings: number;
        deboardings: number;
        denied: number;
        uniqueStudents: Set<string>;
        lastEventAt: Date | null;
      }
    >();

    for (const bus of buses) {
      busMap.set(bus.id, {
        id: bus.id,
        plate: bus.plate,
        capacity: bus.capacity,
        deviceNames: bus.devices.map(
          (device) => device.name ?? device.code ?? 'UniHub',
        ),
        routeNames: Array.from(
          new Set(bus.schedules.map((schedule) => schedule.route.name)),
        ),
        trips: 0,
        boardings: 0,
        deboardings: 0,
        denied: 0,
        uniqueStudents: new Set<string>(),
        lastEventAt: null,
      });
    }

    const chart = this.createDailyChartData(filters.startDate, filters.endDate, {
      trips: 0,
      boardings: 0,
      activeBuses: 0,
    });
    const chartBusSets = new Map<string, Set<string>>();

    for (const event of events) {
      const bus = event.device.bus;

      if (!bus) {
        continue;
      }

      const record =
        busMap.get(bus.id) ??
        {
          id: bus.id,
          plate: bus.plate,
          capacity: bus.capacity,
          deviceNames: [event.device.name ?? event.device.code ?? 'UniHub'],
          routeNames: [],
          trips: 0,
          boardings: 0,
          deboardings: 0,
          denied: 0,
          uniqueStudents: new Set<string>(),
          lastEventAt: null,
        };

      record.lastEventAt = record.lastEventAt ?? event.createdAt;

      if (event.studentId) {
        record.uniqueStudents.add(event.studentId);
      }

      if (event.type === 'BOARDING') {
        record.boardings += 1;
      } else if (event.type === 'DEBOARDING') {
        record.deboardings += 1;
      } else if (event.type === 'DENIED') {
        record.denied += 1;
      }

      busMap.set(bus.id, record);

      const dateKey = this.getDateKey(event.createdAt);
      const bucket = chart.index.get(dateKey);

      if (event.type === 'BOARDING' && bucket) {
        bucket.boardings += 1;
      }

      const busSet = chartBusSets.get(dateKey) ?? new Set<string>();
      busSet.add(bus.id);
      chartBusSets.set(dateKey, busSet);
    }

    for (const trip of trips) {
      if (!trip.busId) {
        continue;
      }

      const record = busMap.get(trip.busId);

      if (record) {
        record.trips += 1;
      }

      const dateKey = this.getDateKey(trip.startedAt);
      const bucket = chart.index.get(dateKey);

      if (bucket) {
        bucket.trips += 1;
      }

      const busSet = chartBusSets.get(dateKey) ?? new Set<string>();
      busSet.add(trip.busId);
      chartBusSets.set(dateKey, busSet);
    }

    for (const point of chart.data) {
      point.activeBuses = chartBusSets.get(point.date)?.size ?? 0;
    }

    const rows = Array.from(busMap.values()).sort((left, right) => {
      if (right.boardings !== left.boardings) {
        return right.boardings - left.boardings;
      }

      if (right.trips !== left.trips) {
        return right.trips - left.trips;
      }

      return left.plate.localeCompare(right.plate);
    });

    const busesWithActivity = rows.filter(
      (row) => row.trips > 0 || row.boardings > 0 || row.deboardings > 0 || row.denied > 0,
    ).length;
    const totalBoardings = rows.reduce((sum, row) => sum + row.boardings, 0);

    return {
      type: 'fleet',
      title: 'Relatorio de frota',
      description:
        'Consolida o uso de onibus e dispositivos no periodo, ajudando a enxergar carga operacional.',
      highlight: this.formatPeriodLabel(filters.startDate, filters.endDate),
      summaryCards: [
        {
          label: 'Onibus analisados',
          value: this.formatCount(rows.length),
          helper: 'Quantidade de veiculos considerados no recorte.',
        },
        {
          label: 'Com atividade',
          value: this.formatCount(busesWithActivity),
          helper: 'Onibus com viagem ou evento registrado.',
        },
        {
          label: 'Viagens registradas',
          value: this.formatCount(trips.length),
          helper: 'Saidas registradas no periodo.',
        },
        {
          label: 'Media de boardings/onibus',
          value: this.formatDecimal(rows.length > 0 ? totalBoardings / rows.length : 0),
          helper: 'Volume medio de entradas por veiculo filtrado.',
        },
      ],
      chart: {
        title: 'Carga operacional por dia',
        description:
          'Cruza boardings, viagens registradas e quantidade de onibus ativos por dia.',
        xKey: 'date',
        series: [
          { key: 'trips', label: 'Viagens', color: '#ffd0b2' },
          { key: 'boardings', label: 'Boardings', color: '#ff7a2f' },
          { key: 'activeBuses', label: 'Onibus ativos', color: '#c2410c' },
        ],
        data: chart.data,
      },
      table: {
        title: 'Resumo por onibus',
        description:
          'Ajuda a comparar uso, lotacao potencial, dispositivos e rotas vinculadas.',
        columns: [
          { key: 'bus', label: 'Onibus' },
          { key: 'capacity', label: 'Capacidade' },
          { key: 'devices', label: 'UniHubs' },
          { key: 'routes', label: 'Rotas vinculadas' },
          { key: 'trips', label: 'Viagens' },
          { key: 'boardings', label: 'Boardings' },
          { key: 'deboardings', label: 'Desembarques' },
          { key: 'students', label: 'Alunos unicos' },
          { key: 'lastEvent', label: 'Ultimo evento' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          values: {
            bus: row.plate,
            capacity: this.formatCount(row.capacity),
            devices: row.deviceNames.join(', ') || '--',
            routes: this.joinRouteNames(row.routeNames) ?? '--',
            trips: this.formatCount(row.trips),
            boardings: this.formatCount(row.boardings),
            deboardings: this.formatCount(row.deboardings),
            students: this.formatCount(row.uniqueStudents.size),
            lastEvent: row.lastEventAt ? this.formatDateTime(row.lastEventAt) : '--',
          },
        })),
        emptyTitle: 'Nenhum onibus encontrado',
        emptyDescription:
          'Use outro periodo ou revise os filtros de rota e onibus para montar o relatorio.',
      },
    };
  }

  private async buildRoutesReport(
    companyId: string,
    filters: DashboardReportFilters,
  ): Promise<DashboardReportPayload> {
    const studentScope = this.buildStudentScope(filters);
    const [routes, events] = await this.prisma.$transaction([
      this.prisma.route.findMany({
        where: {
          companyId,
          ...(filters.routeId ? { id: filters.routeId } : {}),
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          active: true,
          schedules: {
            select: {
              id: true,
            },
          },
          students: {
            where: {
              ...(Object.keys(studentScope).length > 0
                ? {
                    student: studentScope,
                  }
                : {}),
            },
            select: {
              student: {
                select: {
                  id: true,
                  active: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.transportEvent.findMany({
        where: {
          companyId,
          createdAt: this.buildDateRange(filters.startDate, filters.endDate),
          studentId: {
            not: null,
          },
          ...(filters.busId ? { device: { busId: filters.busId } } : {}),
          student: {
            ...studentScope,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          studentId: true,
          student: {
            select: {
              routes: {
                select: {
                  route: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const routeMap = new Map<
      string,
      {
        id: string;
        name: string;
        active: boolean;
        schedules: number;
        assignedStudents: number;
        activeStudents: number;
        boardings: number;
        deboardings: number;
        denied: number;
        uniqueStudents: Set<string>;
        lastEventAt: Date | null;
      }
    >();

    for (const route of routes) {
      const assignedStudentIds = new Set(
        route.students.map((item) => item.student.id),
      );
      const activeStudents = route.students.filter(
        (item) => item.student.active,
      ).length;

      routeMap.set(route.id, {
        id: route.id,
        name: route.name,
        active: route.active,
        schedules: route.schedules.length,
        assignedStudents: assignedStudentIds.size,
        activeStudents,
        boardings: 0,
        deboardings: 0,
        denied: 0,
        uniqueStudents: new Set<string>(),
        lastEventAt: null,
      });
    }

    const chart = this.createDailyChartData(filters.startDate, filters.endDate, {
      routesWithMovement: 0,
      boardings: 0,
    });
    const chartRouteSets = new Map<string, Set<string>>();

    for (const event of events) {
      if (!event.studentId) {
        continue;
      }

      const relatedRouteIds = event.student?.routes
        .map((item) => item.route.id)
        .filter((routeId) => routeMap.has(routeId));

      if (!relatedRouteIds || relatedRouteIds.length === 0) {
        continue;
      }

      const dateKey = this.getDateKey(event.createdAt);
      const routeSet = chartRouteSets.get(dateKey) ?? new Set<string>();

      for (const routeId of relatedRouteIds) {
        const record = routeMap.get(routeId);

        if (!record) {
          continue;
        }

        record.lastEventAt = record.lastEventAt ?? event.createdAt;
        record.uniqueStudents.add(event.studentId);
        routeSet.add(routeId);

        if (event.type === 'BOARDING') {
          record.boardings += 1;
        } else if (event.type === 'DEBOARDING') {
          record.deboardings += 1;
        } else if (event.type === 'DENIED') {
          record.denied += 1;
        }
      }

      chartRouteSets.set(dateKey, routeSet);

      if (event.type === 'BOARDING') {
        const bucket = chart.index.get(dateKey);
        if (bucket) {
          bucket.boardings += 1;
        }
      }
    }

    for (const point of chart.data) {
      point.routesWithMovement = chartRouteSets.get(point.date)?.size ?? 0;
    }

    const rows = Array.from(routeMap.values()).sort((left, right) => {
      if (right.boardings !== left.boardings) {
        return right.boardings - left.boardings;
      }

      return left.name.localeCompare(right.name);
    });

    const routesWithMovement = rows.filter(
      (row) => row.boardings > 0 || row.deboardings > 0 || row.denied > 0,
    ).length;
    const assignedStudents = new Set(
      routes.flatMap((route) => route.students.map((item) => item.student.id)),
    ).size;

    return {
      type: 'routes',
      title: 'Relatorio de rotas',
      description:
        'Resume rotas cadastradas, alunos vinculados e o uso operacional no periodo filtrado.',
      highlight: this.formatPeriodLabel(filters.startDate, filters.endDate),
      summaryCards: [
        {
          label: 'Rotas analisadas',
          value: this.formatCount(rows.length),
          helper: 'Quantidade de rotas consideradas no relatorio.',
        },
        {
          label: 'Rotas com uso',
          value: this.formatCount(routesWithMovement),
          helper: 'Rotas com pelo menos um evento de transporte.',
        },
        {
          label: 'Alunos vinculados',
          value: this.formatCount(assignedStudents),
          helper: 'Total unico de alunos vinculados nas rotas filtradas.',
        },
        {
          label: 'Boardings nas rotas',
          value: this.formatCount(
            rows.reduce((sum, row) => sum + row.boardings, 0),
          ),
          helper: 'Entradas associadas aos alunos vinculados nas rotas.',
        },
      ],
      chart: {
        title: 'Uso por dia nas rotas',
        description:
          'Compara volume de boardings com a quantidade de rotas que tiveram movimentacao.',
        xKey: 'date',
        series: [
          { key: 'boardings', label: 'Boardings', color: '#ff8b4c' },
          {
            key: 'routesWithMovement',
            label: 'Rotas com uso',
            color: '#c2410c',
          },
        ],
        data: chart.data,
      },
      table: {
        title: 'Resumo por rota',
        description:
          'Mostra capacidade operacional de cada rota com alunos vinculados, horarios e movimentacao.',
        columns: [
          { key: 'route', label: 'Rota' },
          { key: 'status', label: 'Status' },
          { key: 'students', label: 'Alunos vinculados' },
          { key: 'activeStudents', label: 'Ativos' },
          { key: 'schedules', label: 'Horarios' },
          { key: 'boardings', label: 'Boardings' },
          { key: 'deboardings', label: 'Desembarques' },
          { key: 'studentsWithUsage', label: 'Alunos com uso' },
          { key: 'lastEvent', label: 'Ultimo evento' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          values: {
            route: row.name,
            status: row.active ? 'Ativa' : 'Inativa',
            students: this.formatCount(row.assignedStudents),
            activeStudents: this.formatCount(row.activeStudents),
            schedules: this.formatCount(row.schedules),
            boardings: this.formatCount(row.boardings),
            deboardings: this.formatCount(row.deboardings),
            studentsWithUsage: this.formatCount(row.uniqueStudents.size),
            lastEvent: row.lastEventAt ? this.formatDateTime(row.lastEventAt) : '--',
          },
        })),
        emptyTitle: 'Nenhuma rota encontrada',
        emptyDescription:
          'Ajuste os filtros para localizar rotas com alunos vinculados ou movimentacao.',
      },
    };
  }

  private async buildGroupsReport(
    companyId: string,
    filters: DashboardReportFilters,
  ): Promise<DashboardReportPayload> {
    const studentScope = this.buildStudentScope(filters);
    const [groups, events] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where: {
          companyId,
          ...(filters.groupId ? { id: filters.groupId } : {}),
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          active: true,
          students: {
            where: Object.keys(studentScope).length > 0 ? studentScope : {},
            select: {
              id: true,
              active: true,
            },
          },
        },
      }),
      this.prisma.transportEvent.findMany({
        where: {
          companyId,
          createdAt: this.buildDateRange(filters.startDate, filters.endDate),
          studentId: {
            not: null,
          },
          ...(filters.busId ? { device: { busId: filters.busId } } : {}),
          student: {
            ...studentScope,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          studentId: true,
          student: {
            select: {
              groupId: true,
            },
          },
        },
      }),
    ]);

    const groupMap = new Map<
      string,
      {
        id: string;
        name: string;
        active: boolean;
        students: number;
        activeStudents: number;
        boardings: number;
        deboardings: number;
        denied: number;
        uniqueStudents: Set<string>;
        lastEventAt: Date | null;
      }
    >();

    for (const group of groups) {
      groupMap.set(group.id, {
        id: group.id,
        name: group.name,
        active: group.active,
        students: group.students.length,
        activeStudents: group.students.filter((student) => student.active).length,
        boardings: 0,
        deboardings: 0,
        denied: 0,
        uniqueStudents: new Set<string>(),
        lastEventAt: null,
      });
    }

    const chart = this.createDailyChartData(filters.startDate, filters.endDate, {
      groupsWithMovement: 0,
      boardings: 0,
    });
    const chartGroupSets = new Map<string, Set<string>>();

    for (const event of events) {
      const groupId = event.student?.groupId;

      if (!event.studentId || !groupId || !groupMap.has(groupId)) {
        continue;
      }

      const record = groupMap.get(groupId);

      if (!record) {
        continue;
      }

      record.lastEventAt = record.lastEventAt ?? event.createdAt;
      record.uniqueStudents.add(event.studentId);

      if (event.type === 'BOARDING') {
        record.boardings += 1;
      } else if (event.type === 'DEBOARDING') {
        record.deboardings += 1;
      } else if (event.type === 'DENIED') {
        record.denied += 1;
      }

      const dateKey = this.getDateKey(event.createdAt);
      const groupSet = chartGroupSets.get(dateKey) ?? new Set<string>();
      groupSet.add(groupId);
      chartGroupSets.set(dateKey, groupSet);

      if (event.type === 'BOARDING') {
        const bucket = chart.index.get(dateKey);
        if (bucket) {
          bucket.boardings += 1;
        }
      }
    }

    for (const point of chart.data) {
      point.groupsWithMovement = chartGroupSets.get(point.date)?.size ?? 0;
    }

    const rows = Array.from(groupMap.values()).sort((left, right) => {
      if (right.boardings !== left.boardings) {
        return right.boardings - left.boardings;
      }

      return left.name.localeCompare(right.name);
    });

    const groupsWithMovement = rows.filter(
      (row) => row.boardings > 0 || row.deboardings > 0 || row.denied > 0,
    ).length;

    return {
      type: 'groups',
      title: 'Relatorio de grupos',
      description:
        'Compara grupos da empresa e destaca quais concentraram mais alunos e uso no transporte.',
      highlight: this.formatPeriodLabel(filters.startDate, filters.endDate),
      summaryCards: [
        {
          label: 'Grupos analisados',
          value: this.formatCount(rows.length),
          helper: 'Total de grupos considerados nos filtros.',
        },
        {
          label: 'Com movimentacao',
          value: this.formatCount(groupsWithMovement),
          helper: 'Grupos com pelo menos um evento de transporte no periodo.',
        },
        {
          label: 'Alunos nos grupos',
          value: this.formatCount(
            rows.reduce((sum, row) => sum + row.students, 0),
          ),
          helper: 'Soma dos alunos distribuidos nos grupos filtrados.',
        },
        {
          label: 'Media de boardings/grupo',
          value: this.formatDecimal(
            rows.length > 0
              ? rows.reduce((sum, row) => sum + row.boardings, 0) / rows.length
              : 0,
          ),
          helper: 'Ajuda a comparar intensidade de uso entre grupos.',
        },
      ],
      chart: {
        title: 'Uso dos grupos por dia',
        description:
          'Mostra os boardings do periodo e quantos grupos tiveram movimentacao diaria.',
        xKey: 'date',
        series: [
          { key: 'boardings', label: 'Boardings', color: '#ff8d54' },
          {
            key: 'groupsWithMovement',
            label: 'Grupos com uso',
            color: '#ea580c',
          },
        ],
        data: chart.data,
      },
      table: {
        title: 'Resumo por grupo',
        description:
          'Leitura rapida para comparar base de alunos, uso do transporte e ultimo movimento por grupo.',
        columns: [
          { key: 'group', label: 'Grupo' },
          { key: 'status', label: 'Status' },
          { key: 'students', label: 'Alunos' },
          { key: 'activeStudents', label: 'Ativos' },
          { key: 'boardings', label: 'Boardings' },
          { key: 'deboardings', label: 'Desembarques' },
          { key: 'denied', label: 'Negados' },
          { key: 'studentsWithUsage', label: 'Alunos com uso' },
          { key: 'lastEvent', label: 'Ultimo evento' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          values: {
            group: row.name,
            status: row.active ? 'Ativo' : 'Inativo',
            students: this.formatCount(row.students),
            activeStudents: this.formatCount(row.activeStudents),
            boardings: this.formatCount(row.boardings),
            deboardings: this.formatCount(row.deboardings),
            denied: this.formatCount(row.denied),
            studentsWithUsage: this.formatCount(row.uniqueStudents.size),
            lastEvent: row.lastEventAt ? this.formatDateTime(row.lastEventAt) : '--',
          },
        })),
        emptyTitle: 'Nenhum grupo encontrado',
        emptyDescription:
          'Revise os filtros para encontrar grupos com alunos vinculados ou uso no periodo.',
      },
    };
  }

  private normalizeReportFilters(
    query: GetDashboardReportDto,
  ): DashboardReportFilters {
    const todayDateKey = this.getDateKey(new Date());
    const endDate = query.endDate || todayDateKey;
    const startDate = query.startDate || addDaysToDateKey(endDate, -6);

    if (startDate > endDate) {
      throw new BadRequestException(
        'A data inicial nao pode ser maior que a data final.',
      );
    }

    return {
      reportType: query.reportType ?? 'boarding',
      startDate,
      endDate,
      busId: this.normalizeFilterValue(query.busId),
      routeId: this.normalizeFilterValue(query.routeId),
      groupId: this.normalizeFilterValue(query.groupId),
      eventType: query.eventType ?? 'ALL',
      studentStatus: query.studentStatus ?? 'all',
    };
  }

  private normalizeFilterValue(value?: string | null) {
    if (!value) {
      return null;
    }

    const normalized = value.trim();

    return normalized && normalized !== 'all' ? normalized : null;
  }

  private async getReportOptions(companyId: string) {
    const [buses, routes, groups] = await this.prisma.$transaction([
      this.prisma.bus.findMany({
        where: { companyId },
        orderBy: { plate: 'asc' },
        select: {
          id: true,
          plate: true,
          capacity: true,
        },
      }),
      this.prisma.route.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          active: true,
        },
      }),
      this.prisma.group.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          active: true,
        },
      }),
    ]);

    return {
      buses: buses.map((bus) => ({
        value: bus.id,
        label: `${bus.plate} - ${bus.capacity} lugares`,
      })),
      routes: routes.map((route) => ({
        value: route.id,
        label: route.active ? route.name : `${route.name} (inativa)`,
      })),
      groups: groups.map((group) => ({
        value: group.id,
        label: group.active ? group.name : `${group.name} (inativo)`,
      })),
    };
  }

  private buildStudentScope(filters: DashboardReportFilters) {
    return {
      ...(filters.groupId ? { groupId: filters.groupId } : {}),
      ...(filters.routeId
        ? {
            routes: {
              some: {
                routeId: filters.routeId,
              },
            },
          }
        : {}),
      ...(filters.studentStatus === 'active'
        ? { active: true }
        : filters.studentStatus === 'inactive'
          ? { active: false }
          : {}),
    } satisfies Prisma.StudentWhereInput;
  }

  private buildTransportEventStudentScope(filters: DashboardReportFilters) {
    const studentScope = this.buildStudentScope(filters);

    return Object.keys(studentScope).length > 0
      ? {
          student: studentScope,
        }
      : {};
  }

  private buildDateRange(startDate: string, endDate: string) {
    return {
      gte: this.parseDateKey(startDate, false),
      lte: this.parseDateKey(endDate, true),
    } satisfies Prisma.DateTimeFilter;
  }

  private parseDateKey(dateKey: string, endOfDay: boolean) {
    const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
    return new Date(`${dateKey}T${time}-03:00`);
  }

  private createDailyChartData<T extends Record<string, number>>(
    startDate: string,
    endDate: string,
    baseValues: T,
  ) {
    const data: Array<{ date: string } & T> = [];
    const index = new Map<string, { date: string } & T>();

    let currentDate = startDate;

    while (currentDate <= endDate) {
      const entry = {
        date: currentDate,
        ...Object.fromEntries(
          Object.keys(baseValues).map((key) => [key, baseValues[key]]),
        ),
      } as { date: string } & T;

      data.push(entry);
      index.set(currentDate, entry);
      currentDate = addDaysToDateKey(currentDate, 1);
    }

    return { data, index };
  }

  private joinRouteNames(routeNames: string[]) {
    const uniqueNames = Array.from(
      new Set(routeNames.map((routeName) => routeName.trim()).filter(Boolean)),
    );

    return uniqueNames.length > 0 ? uniqueNames.join(', ') : null;
  }

  private formatCount(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDecimal(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: this.getTimeZone(),
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatDateTime(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: this.getTimeZone(),
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatPeriodLabel(startDate: string, endDate: string) {
    return `Periodo ${this.formatDate(this.parseDateKey(startDate, false))} ate ${this.formatDate(this.parseDateKey(endDate, true))}`;
  }

  private getDateKey(date: Date) {
    return getZonedDateParts(date, this.getTimeZone()).dateKey;
  }

  private getTimeZone() {
    return getAppTimeZone(this.configService.get<string>('APP_TIMEZONE'));
  }

  private formatEventType(type: EventType) {
    const labels: Record<EventType, string> = {
      BOARDING: 'Boarding',
      DEBOARDING: 'Desembarque',
      LEAVING: 'Saida',
      DENIED: 'Negado',
    };

    return labels[type];
  }
}
