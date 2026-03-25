"use client";

import { useBuses } from "./hooks/useBuses";

export default function BusesPage() {
  const { buses, createBus, updateBus, deleteBus } = useBuses();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Ônibus</h1>

      {/* botão criar */}
      {/* tabela */}
    </div>
  );
}
