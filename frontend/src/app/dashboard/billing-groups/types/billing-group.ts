export type BillingTemplateRecurrence =
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "SEMIANNUAL"
  | "YEARLY";

export interface BillingGroup {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  targetScope: "STUDENTS" | "COORDINATORS" | "STUDENTS_AND_COORDINATORS";
  amountCents: number;
  dueDay: number;
  recurrence: BillingTemplateRecurrence;
  notifyOnGeneration: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    students: number;
  };
}

export const billingRecurrenceLabels: Record<BillingTemplateRecurrence, string> =
  {
    MONTHLY: "Mensal",
    BIMONTHLY: "Bimestral",
    QUARTERLY: "Trimestral",
    SEMIANNUAL: "Semestral",
    YEARLY: "Anual",
  };
