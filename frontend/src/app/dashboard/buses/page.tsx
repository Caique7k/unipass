"use client";

import { useBuses } from "./hooks/useBuses";
import { BusesTable } from "./components/BusesTable";
import { BusFormModal } from "./components/BusFormModal";

export default function BusesPage() {
  const busesHook = useBuses();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ônibus</h1>
        <BusFormModal {...busesHook} />
      </div>

      <BusesTable {...busesHook} />
    </div>
  );
}
