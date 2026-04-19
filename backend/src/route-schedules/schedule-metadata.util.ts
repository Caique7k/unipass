type ScheduleMetadata = {
  departureMinutes: number;
  notificationTimeMinutes: number;
  notificationDayOfWeeks: number[];
};

export function getScheduleMetadata(params: {
  departureTime: Date;
  dayOfWeeks: number[];
  notifyBeforeMinutes: number;
}): ScheduleMetadata {
  const departureMinutes =
    params.departureTime.getUTCHours() * 60 +
    params.departureTime.getUTCMinutes();
  const notificationTimeMinutes =
    (departureMinutes - params.notifyBeforeMinutes + 1440) % 1440;
  const notificationDayOfWeeks = Array.from(
    new Set(
      params.dayOfWeeks.map((dayOfWeek) =>
        params.notifyBeforeMinutes > departureMinutes
          ? (dayOfWeek + 6) % 7
          : dayOfWeek,
      ),
    ),
  ).sort((left, right) => left - right);

  return {
    departureMinutes,
    notificationTimeMinutes,
    notificationDayOfWeeks,
  };
}
