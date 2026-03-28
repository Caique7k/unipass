export type LocationBus = {
  id: string;
  plate: string;
  capacity: number;
  companyId: string;
  createdAt: string;
};

export type LocationDevice = {
  id: string;
  name: string;
  busId: string | null;
  hardwareId: string;
  code: string | null;
  secret: string | null;
  active: boolean;
  companyId: string;
  createdAt: string;
  bus?: {
    id: string;
    plate: string;
  } | null;
};

export type LocationMapState =
  | "no-buses"
  | "needs-pairing"
  | "no-online-device"
  | "awaiting-gps";

export type LocationViewModel = {
  selectedBus: LocationBus | null;
  linkedDevice: LocationDevice | null;
  activeDevices: LocationDevice[];
  state: LocationMapState;
};
