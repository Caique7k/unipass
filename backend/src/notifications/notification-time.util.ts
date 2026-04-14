const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export const DEFAULT_APP_TIMEZONE = 'America/Sao_Paulo';

export type ZonedDateParts = {
  dateKey: string;
  dayOfWeek: number;
  hours: number;
  minutes: number;
  minutesOfDay: number;
};

export function getAppTimeZone(value?: string | null) {
  return value?.trim() || DEFAULT_APP_TIMEZONE;
}

export function getZonedDateParts(date: Date, timeZone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hours = Number(parts.hour);
  const minutes = Number(parts.minute);
  const dayOfWeek = WEEKDAY_MAP[parts.weekday] ?? 0;
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    dateKey,
    dayOfWeek,
    hours,
    minutes,
    minutesOfDay: hours * 60 + minutes,
  };
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));

  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

export function isPromptExpired(params: {
  occurrenceKey: string;
  departureMinutes: number;
  now: Date;
  timeZone: string;
}) {
  const current = getZonedDateParts(params.now, params.timeZone);

  if (current.dateKey > params.occurrenceKey) {
    return true;
  }

  if (current.dateKey < params.occurrenceKey) {
    return false;
  }

  return current.minutesOfDay > params.departureMinutes;
}
