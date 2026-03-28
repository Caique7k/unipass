export type LocationBus = {
  id: string;
  plate: string;
  capacity: number;
  companyId: string;
  createdAt: string;
};

export type LocationDevice = {
  id: string;
  name: string | null;
  busId: string | null;
  hardwareId: string;
  code: string | null;
  secret: string | null;
  active: boolean;
  companyId: string;
  createdAt: string;
  lastLat?: number | null;
  lastLng?: number | null;
  lastUpdate?: string | null;
};

export type LiveTelemetry = {
  latitude: number;
  longitude: number;
  lastUpdate: string;
};

export type TelemetryPoint = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type LiveBusState =
  | "no-buses"
  | "needs-pairing"
  | "no-online-device"
  | "live"
  | "stale";

export type RouteSummary = {
  speedKmh: number | null;
  originLabel: string;
  destinationLabel: string;
  lastUpdateLabel: string;
  statusBadge: string;
};

export type LocationViewModel = {
  selectedBus: LocationBus | null;
  linkedDevice: LocationDevice | null;
  state: LiveBusState;
  telemetry: LiveTelemetry | null;
  trail: TelemetryPoint[];
  summary: RouteSummary;
};

export type LiveBusResponse = {
  bus: LocationBus;
  linkedDevice: LocationDevice | null;
  state: Exclude<LiveBusState, "no-buses">;
  telemetry: LiveTelemetry | null;
};
