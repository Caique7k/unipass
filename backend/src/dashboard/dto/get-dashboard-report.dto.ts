import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const DASHBOARD_REPORT_TYPES = [
  'boarding',
  'students',
  'fleet',
  'routes',
  'groups',
] as const;

export const DASHBOARD_REPORT_EVENT_TYPES = [
  'ALL',
  'BOARDING',
  'DEBOARDING',
  'LEAVING',
  'DENIED',
] as const;

export const DASHBOARD_REPORT_STUDENT_STATUSES = [
  'all',
  'active',
  'inactive',
] as const;

export type DashboardReportType =
  (typeof DASHBOARD_REPORT_TYPES)[number];
export type DashboardReportEventType =
  (typeof DASHBOARD_REPORT_EVENT_TYPES)[number];
export type DashboardReportStudentStatus =
  (typeof DASHBOARD_REPORT_STUDENT_STATUSES)[number];

export class GetDashboardReportDto {
  @IsOptional()
  @Transform(trimString)
  @IsIn(DASHBOARD_REPORT_TYPES)
  reportType?: DashboardReportType;

  @IsOptional()
  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  busId?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  routeId?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  groupId?: string;

  @IsOptional()
  @Transform(trimString)
  @IsIn(DASHBOARD_REPORT_EVENT_TYPES)
  eventType?: DashboardReportEventType;

  @IsOptional()
  @Transform(trimString)
  @IsIn(DASHBOARD_REPORT_STUDENT_STATUSES)
  studentStatus?: DashboardReportStudentStatus;
}
