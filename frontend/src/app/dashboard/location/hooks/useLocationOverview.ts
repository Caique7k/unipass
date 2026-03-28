"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import type {
  LocationBus,
  LocationDevice,
  LocationMapState,
  LocationViewModel,
} from "../types";

type BusesResponse = {
  data: LocationBus[];
  total: number;
  lastPage: number;
};

type DevicesResponse = {
  data: LocationDevice[];
  lastPage: number;
};

function buildViewModel(
  buses: LocationBus[],
  devices: LocationDevice[],
  selectedBusId: string,
): LocationViewModel {
  const selectedBus = buses.find((bus) => bus.id === selectedBusId) ?? null;
  const activeDevices = devices.filter((device) => device.active);
  const linkedDevice =
    activeDevices.find((device) => device.busId === selectedBusId) ?? null;

  let state: LocationMapState = "awaiting-gps";

  if (!selectedBus) {
    state = "no-buses";
  } else if (!devices.some((device) => device.busId === selectedBusId)) {
    state = "needs-pairing";
  } else if (activeDevices.length === 0 || !linkedDevice) {
    state = "no-online-device";
  }

  return {
    selectedBus,
    linkedDevice,
    activeDevices,
    state,
  };
}

export function useLocationOverview() {
  const [buses, setBuses] = useState<LocationBus[]>([]);
  const [devices, setDevices] = useState<LocationDevice[]>([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchOverview() {
    try {
      setIsRefreshing(true);
      setError(null);

      const [busesResponse, devicesResponse] = await Promise.all([
        api.get<BusesResponse>("/buses", {
          params: {
            page: 1,
            limit: 100,
          },
        }),
        api.get<DevicesResponse>("/devices", {
          params: {
            page: 1,
            limit: 100,
          },
        }),
      ]);

      const nextBuses = busesResponse.data.data ?? [];
      const nextDevices = devicesResponse.data.data ?? [];

      setBuses(nextBuses);
      setDevices(nextDevices);

      setSelectedBusId((current) => {
        if (current && nextBuses.some((bus) => bus.id === current)) {
          return current;
        }

        return nextBuses[0]?.id ?? "";
      });
    } catch (err) {
      console.error("Erro ao carregar visão de localização:", err);
      setError("Não foi possível carregar os dados de localização.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOverview();

    const interval = window.setInterval(() => {
      fetchOverview();
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  const viewModel = useMemo(
    () => buildViewModel(buses, devices, selectedBusId),
    [buses, devices, selectedBusId],
  );

  return {
    buses,
    devices,
    selectedBusId,
    setSelectedBusId,
    loading,
    isRefreshing,
    error,
    refetch: fetchOverview,
    viewModel,
  };
}
