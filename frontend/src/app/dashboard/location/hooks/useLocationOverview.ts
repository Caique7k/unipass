"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/services/api";
import type {
  LiveBusResponse,
  LocationBus,
  LocationViewModel,
  TelemetryPoint,
} from "../types";

type BusesResponse = {
  data: LocationBus[];
  total: number;
  lastPage: number;
};

const MAX_TRAIL_POINTS = 24;
const TRAIL_SESSION_GAP_MS = 60_000;

function samePoint(a: TelemetryPoint, b: TelemetryPoint) {
  return a.latitude === b.latitude && a.longitude === b.longitude && a.timestamp === b.timestamp;
}

function toTelemetryPoint(response: LiveBusResponse): TelemetryPoint | null {
  if (!response.telemetry) {
    return null;
  }

  return {
    heading: response.telemetry.heading ?? null,
    latitude: response.telemetry.latitude,
    longitude: response.telemetry.longitude,
    timestamp: response.telemetry.lastUpdate,
  };
}

function shouldResetTrailSession(
  previousPoint: TelemetryPoint | undefined,
  nextPoint: TelemetryPoint,
) {
  if (!previousPoint) {
    return false;
  }

  const previousTimestamp = new Date(previousPoint.timestamp).getTime();
  const nextTimestamp = new Date(nextPoint.timestamp).getTime();
  const elapsedMs = nextTimestamp - previousTimestamp;

  return elapsedMs <= 0 || elapsedMs > TRAIL_SESSION_GAP_MS;
}

function normalizeBearing(value: number) {
  return ((value % 360) + 360) % 360;
}

function calculateBearing(from: TelemetryPoint, to: TelemetryPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const toDeg = (value: number) => (value * 180) / Math.PI;

  const latitudeFrom = toRad(from.latitude);
  const latitudeTo = toRad(to.latitude);
  const longitudeDelta = toRad(to.longitude - from.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(latitudeTo);
  const x =
    Math.cos(latitudeFrom) * Math.sin(latitudeTo) -
    Math.sin(latitudeFrom) * Math.cos(latitudeTo) * Math.cos(longitudeDelta);

  return normalizeBearing(toDeg(Math.atan2(y, x)));
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatPointLabel(point: TelemetryPoint | undefined) {
  if (!point) {
    return "-";
  }

  return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

function buildSummary(
  state: LocationViewModel["state"],
  trail: TelemetryPoint[],
) {
  const origin = trail[0];
  const destination = trail[trail.length - 1];
  const previous = trail[trail.length - 2];

  let speedKmh: number | null = null;

  if (previous && destination) {
    const distanceKm = haversineKm(
      previous.latitude,
      previous.longitude,
      destination.latitude,
      destination.longitude,
    );
    const elapsedMs =
      new Date(destination.timestamp).getTime() -
      new Date(previous.timestamp).getTime();

    if (elapsedMs > 0) {
      speedKmh = (distanceKm / (elapsedMs / 3_600_000));
    }
  }

  return {
    speedKmh:
      speedKmh !== null && Number.isFinite(speedKmh)
        ? Number(speedKmh.toFixed(1))
        : null,
    originLabel: formatPointLabel(origin),
    destinationLabel: formatPointLabel(destination),
    lastUpdateLabel: destination
      ? new Date(destination.timestamp).toLocaleTimeString("pt-BR")
      : "-",
    statusBadge:
      state === "live"
        ? "Ao vivo"
        : state === "stale"
          ? "Última posição"
          : "Aguardando dados",
  };
}

export function useLocationOverview() {
  const [buses, setBuses] = useState<LocationBus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [viewModel, setViewModel] = useState<LocationViewModel>({
    selectedBus: null,
    linkedDevice: null,
    state: "no-buses",
    telemetry: null,
    trail: [],
    summary: {
      speedKmh: null,
      originLabel: "-",
      destinationLabel: "-",
      lastUpdateLabel: "-",
      statusBadge: "Aguardando dados",
    },
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trailByBusRef = useRef<Record<string, TelemetryPoint[]>>({});
  const lastStateByBusRef = useRef<Record<string, LocationViewModel["state"]>>({});

  const fetchBuses = useCallback(async () => {
    const response = await api.get<BusesResponse>("/buses", {
      params: {
        page: 1,
        limit: 100,
      },
    });

    const nextBuses = response.data.data ?? [];
    setBuses(nextBuses);
    setSelectedBusId((current) => {
      if (current && nextBuses.some((bus) => bus.id === current)) {
        return current;
      }

      return nextBuses[0]?.id ?? "";
    });

    return nextBuses;
  }, []);

  const applyLiveResponse = useCallback((response: LiveBusResponse) => {
    const busId = response.bus.id;
    const nextPoint = toTelemetryPoint(response);
    const currentTrail = trailByBusRef.current[busId] ?? [];
    const previousState = lastStateByBusRef.current[busId];
    const isLiveSession = response.state === "live";
    const lastKnownHeading = currentTrail[currentTrail.length - 1]?.heading ?? null;

    let nextTrail: TelemetryPoint[] = [];

    if (nextPoint && isLiveSession) {
      const lastPoint = currentTrail[currentTrail.length - 1];
      const shouldStartNewTrail =
        previousState !== "live" || shouldResetTrailSession(lastPoint, nextPoint);
      const baseTrail = shouldStartNewTrail ? [] : currentTrail;
      const previousTrailPoint = baseTrail[baseTrail.length - 1];
      const derivedHeading =
        nextPoint.heading ??
        (previousTrailPoint &&
        (previousTrailPoint.latitude !== nextPoint.latitude ||
          previousTrailPoint.longitude !== nextPoint.longitude)
          ? calculateBearing(previousTrailPoint, nextPoint)
          : lastKnownHeading);
      const normalizedPoint = {
        ...nextPoint,
        heading: derivedHeading,
      };

      nextTrail =
        previousTrailPoint && samePoint(previousTrailPoint, normalizedPoint)
          ? baseTrail
          : [...baseTrail, normalizedPoint].slice(-MAX_TRAIL_POINTS);
    } else if (nextPoint) {
      nextTrail = [
        {
          ...nextPoint,
          heading: nextPoint.heading ?? lastKnownHeading,
        },
      ];
    }

    trailByBusRef.current[busId] = nextTrail;
    lastStateByBusRef.current[busId] = response.state;

    setViewModel({
      selectedBus: response.bus,
      linkedDevice: response.linkedDevice,
      state: response.state,
      telemetry: response.telemetry,
      trail: nextTrail,
      summary: buildSummary(response.state, nextTrail),
    });
  }, []);

  const fetchLiveBus = useCallback(
    async (busId: string) => {
      const response = await api.get<LiveBusResponse>(`/location/buses/${busId}/live`);
      applyLiveResponse(response.data);
    },
    [applyLiveResponse],
  );

  const refetch = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const nextBuses = await fetchBuses();
      const resolvedBusId =
        selectedBusId && nextBuses.some((bus) => bus.id === selectedBusId)
          ? selectedBusId
          : nextBuses[0]?.id ?? "";

      if (!resolvedBusId) {
        setViewModel({
          selectedBus: null,
          linkedDevice: null,
          state: "no-buses",
          telemetry: null,
          trail: [],
          summary: buildSummary("no-buses", []),
        });
        return;
      }

      await fetchLiveBus(resolvedBusId);
    } catch (err) {
      console.error("Erro ao carregar visão de localização:", err);
      setError("Não foi possível carregar os dados de localização.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchBuses, fetchLiveBus, selectedBusId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!selectedBusId) {
      return;
    }

    let cancelled = false;

    async function pollSelectedBus() {
      try {
        setError(null);
        const response = await api.get<LiveBusResponse>(
          `/location/buses/${selectedBusId}/live`,
        );

        if (cancelled) {
          return;
        }

        applyLiveResponse(response.data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Erro ao atualizar localização do ônibus:", err);
        setError("Não foi possível atualizar a localização em tempo real.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!trailByBusRef.current[selectedBusId]) {
      trailByBusRef.current[selectedBusId] = [];
    }

    pollSelectedBus();
    const interval = window.setInterval(pollSelectedBus, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applyLiveResponse, selectedBusId]);

  const selectedBus = useMemo(
    () => buses.find((bus) => bus.id === selectedBusId) ?? null,
    [buses, selectedBusId],
  );

  return {
    buses,
    selectedBusId,
    setSelectedBusId,
    selectedBus,
    loading,
    isRefreshing,
    error,
    refetch,
    viewModel,
  };
}
