export type ScheduleType = "GO" | "BACK" | "SHIFT";

export interface Schedule {
  id: string;
  routeId: string;
  type: ScheduleType;
  title?: string | null;
  departureTime: string;
  dayOfWeeks: number[];
  notifyBeforeMinutes: number;
  active: boolean;
  bus?: {
    id: string;
    plate: string;
  } | null;
}
