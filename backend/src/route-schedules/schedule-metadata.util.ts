type ScheduleMetadata = {
  departureMinutes: number;
  notificationTimeMinutes: number;
  notificationDayOfWeek: number | null;
};

export function getScheduleMetadata(params: {
  departureTime: Date;
  dayOfWeek?: number | null;
  notifyBeforeMinutes: number;
}): ScheduleMetadata {
  const departureMinutes =
    params.departureTime.getUTCHours() * 60 +
    params.departureTime.getUTCMinutes();
  const notificationTimeMinutes =
    (departureMinutes - params.notifyBeforeMinutes + 1440) % 1440;
  const notificationDayOfWeek =
    params.dayOfWeek === null || params.dayOfWeek === undefined
      ? null
      : params.notifyBeforeMinutes > departureMinutes
        ? (params.dayOfWeek + 6) % 7
        : params.dayOfWeek;

  return {
    departureMinutes,
    notificationTimeMinutes,
    notificationDayOfWeek,
  };
}
