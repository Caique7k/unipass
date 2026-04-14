export interface Route {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  _count?: {
    schedules: number;
  };
}
