export type Device = {
  id: string;
  name: string;
  busId: string | null;
  hardwareId: string;
  code: string | null;
  secret: string | null;
  active: boolean;
  companyId: string;
  createdAt: string;
};
