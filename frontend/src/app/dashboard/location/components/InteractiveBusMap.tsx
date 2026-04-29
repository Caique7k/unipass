"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { BusFront, Flag, Gauge, LocateFixed, Navigation, Route } from "lucide-react";
import { useTheme } from "@/app/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  type MapRef,
  useMap,
} from "@/components/ui/map";
import { cn } from "@/lib/utils";
import type { TelemetryPoint } from "../types";

const OPENSTREET_3D_STYLES = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/liberty",
} as const;

const MAP_CAMERA = {
  bearing: -18,
  pitch: 58,
  zoom: 16,
} as const;

const FALLBACK_3D_SOURCE_ID = "unipass-openfreemap";
const FALLBACK_3D_LAYER_ID = "unipass-openfreemap-3d";
const TRAIL_DASH_PATTERN: [number, number] = [0.9, 1.7];

export function InteractiveBusMap({
  heading,
  latitude,
  longitude,
  plate,
  stale,
  lastUpdateLabel,
  speedLabel,
  originLabel,
  destinationLabel,
  trail,
}: {
  heading: number | null;
  latitude: number;
  longitude: number;
  plate: string;
  stale: boolean;
  lastUpdateLabel: string;
  speedLabel: string;
  originLabel: string;
  destinationLabel: string;
  trail: TelemetryPoint[];
}) {
  const { theme } = useTheme();
  const mapRef = useRef<MapRef | null>(null);

  const center = useMemo<[number, number]>(() => [longitude, latitude], [latitude, longitude]);
  const trailCoordinates = useMemo<[number, number][]>(
    () => trail.map((point) => [point.longitude, point.latitude]),
    [trail],
  );
  const showTrail = !stale && trailCoordinates.length > 1;
  const markerHeading = useResolvedBusHeading({ heading, trail });

  const trailGlowColor = theme === "dark" ? "#ff7a1a" : "#ff9557";
  const trailDashColor = theme === "dark" ? "#fff4e7" : "#fff9f4";

  function recenterMap() {
    mapRef.current?.easeTo({
      bearing: MAP_CAMERA.bearing,
      center,
      duration: 1100,
      essential: true,
      pitch: MAP_CAMERA.pitch,
      zoom: MAP_CAMERA.zoom,
    });
  }

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[30px] bg-[#e7ded5] shadow-sm ring-1 ring-border/60 dark:bg-[#09111d]">
      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          theme={theme}
          className="h-full w-full"
          styles={OPENSTREET_3D_STYLES}
          center={center}
          zoom={MAP_CAMERA.zoom}
          pitch={MAP_CAMERA.pitch}
          bearing={MAP_CAMERA.bearing}
          maxPitch={70}
          canvasContextAttributes={{ antialias: true }}
        >
          <SyncBusCamera center={center} />
          <EnsureThreeDimensionalBuildings />

          {showTrail ? (
            <>
              <MapRoute
                id="unipass-bus-trail-glow"
                coordinates={trailCoordinates}
                color={trailGlowColor}
                width={8}
                opacity={theme === "dark" ? 0.72 : 0.56}
              />
              <MapRoute
                id="unipass-bus-trail-dashed"
                coordinates={trailCoordinates}
                color={trailDashColor}
                width={4.5}
                opacity={0.96}
                dashArray={TRAIL_DASH_PATTERN}
              />
            </>
          ) : null}

          <MapMarker
            longitude={longitude}
            latitude={latitude}
            anchor="center"
            pitchAlignment="viewport"
            rotation={markerHeading}
            rotationAlignment="map"
          >
            <MarkerContent>
              <BusLocationMarker theme={theme} />
            </MarkerContent>
          </MapMarker>

          <MapControls
            position="bottom-right"
            showCompass
            className="bottom-24 right-4 z-20"
          />
        </Map>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black/30 via-black/8 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_28%,rgba(19,24,32,0.16))] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.06),transparent_28%,rgba(2,6,23,0.38))]" />

      <div className="absolute left-4 top-4 z-20 max-w-[310px] rounded-3xl bg-background/92 px-4 py-4 shadow-xl backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
          Navegação UniPass
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">{plate}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {stale
            ? `Última posição conhecida às ${lastUpdateLabel}`
            : `Atualização ao vivo às ${lastUpdateLabel}`}
        </p>
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
            stale
              ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
          )}
        >
          {stale ? "Última posição" : "Ao vivo"}
        </div>
        <div className="rounded-full bg-background/92 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
          <span className="text-muted-foreground">Velocidade</span> {speedLabel}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={recenterMap}
          aria-label="Recentralizar mapa"
          className="rounded-2xl bg-background/92 backdrop-blur"
        >
          <LocateFixed className="size-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 grid w-[calc(100%-2rem)] gap-3 md:w-auto md:grid-cols-3">
        <OverlayCard
          icon={<Flag className="size-4 text-[#ff5c00]" />}
          label="Origem"
          value={originLabel}
        />
        <OverlayCard
          icon={<Navigation className="size-4 text-[#ff5c00]" />}
          label="Destino atual"
          value={destinationLabel}
        />
        <OverlayCard
          icon={<Gauge className="size-4 text-[#ff5c00]" />}
          label="Última atualização"
          value={lastUpdateLabel}
        />
      </div>

      <div className="absolute bottom-4 right-4 z-20 hidden rounded-2xl bg-background/92 px-4 py-3 text-xs text-muted-foreground shadow-lg backdrop-blur lg:block">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Route className="size-4 text-[#ff5c00]" />
          Trilha do ônibus
        </div>
        <p className="mt-1 max-w-[230px]">
          A linha clara continua visível no modo noturno e acompanha a rota recente.
        </p>
      </div>
    </div>
  );
}

function SyncBusCamera({ center }: { center: [number, number] }) {
  const { map, isLoaded } = useMap();
  const previousCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }

    const camera = {
      bearing: MAP_CAMERA.bearing,
      center,
      pitch: MAP_CAMERA.pitch,
      zoom: MAP_CAMERA.zoom,
    };

    const previousCenter = previousCenterRef.current;

    if (!previousCenter) {
      map.jumpTo(camera);
      previousCenterRef.current = center;
      return;
    }

    if (previousCenter[0] === center[0] && previousCenter[1] === center[1]) {
      map.easeTo({ ...camera, duration: 0 });
      return;
    }

    map.easeTo({
      ...camera,
      duration: 1200,
      essential: true,
    });
    previousCenterRef.current = center;
  }, [center, isLoaded, map]);

  return null;
}

function EnsureThreeDimensionalBuildings() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }

    if (map.getLayer("building-3d") || map.getLayer(FALLBACK_3D_LAYER_ID)) {
      return;
    }

    const sourceId = map.getSource("openmaptiles") ? "openmaptiles" : FALLBACK_3D_SOURCE_ID;
    let createdSource = false;

    if (sourceId === FALLBACK_3D_SOURCE_ID) {
      const sourceDefinition: Parameters<typeof map.addSource>[1] = {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
      };
      map.addSource(sourceId, sourceDefinition);
      createdSource = true;
    }

    const labelLayerId = findLabelLayerId(map);
    const layerDefinition: Parameters<typeof map.addLayer>[0] = {
      id: FALLBACK_3D_LAYER_ID,
      type: "fill-extrusion",
      source: sourceId,
      "source-layer": "building",
      minzoom: 14,
      filter: ["!=", ["get", "hide_3d"], true],
      paint: {
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15,
          ["coalesce", ["get", "render_min_height"], 0],
        ],
        "fill-extrusion-color": "#314155",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15,
          ["coalesce", ["get", "render_height"], 0],
        ],
        "fill-extrusion-opacity": 0.72,
      },
    };

    map.addLayer(layerDefinition, labelLayerId);

    return () => {
      if (map.getLayer(FALLBACK_3D_LAYER_ID)) {
        map.removeLayer(FALLBACK_3D_LAYER_ID);
      }

      if (createdSource && map.getSource(FALLBACK_3D_SOURCE_ID)) {
        map.removeSource(FALLBACK_3D_SOURCE_ID);
      }
    };
  }, [isLoaded, map]);

  return null;
}

function findLabelLayerId(map: MapRef) {
  const layers = map.getStyle().layers ?? [];

  for (const layer of layers) {
    const textField = "layout" in layer ? layer.layout?.["text-field"] : undefined;
    if (layer.type === "symbol" && textField) {
      return layer.id;
    }
  }

  return undefined;
}

function BusLocationMarker({ theme }: { theme: "dark" | "light" }) {
  return (
    <div className="relative flex size-[72px] items-center justify-center">
      <div
        className={cn(
          "absolute size-16 rounded-full blur-md",
          theme === "dark" ? "bg-[#ff8a3d]/45" : "bg-[#ff8a3d]/30",
        )}
      />
      <div
        className={cn(
          "absolute top-[7px] h-0 w-0 border-x-[9px] border-b-[16px] border-x-transparent",
          theme === "dark" ? "border-b-[#ffd2b3]" : "border-b-white",
        )}
      />
      <div
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full border border-white/85 bg-[linear-gradient(180deg,#ff9d62_0%,#ff5c00_100%)]",
          "shadow-[0_18px_40px_rgba(255,92,0,0.38)]",
          theme === "dark" && "shadow-[0_20px_44px_rgba(255,92,0,0.52)]",
        )}
      >
        <BusFront className="size-6 text-white drop-shadow-[0_3px_10px_rgba(15,23,42,0.35)]" />
      </div>
      <div className="absolute size-2.5 rounded-full border border-white/90 bg-[#fff6ef] shadow-[0_0_0_8px_rgba(255,92,0,0.16)] dark:shadow-[0_0_0_8px_rgba(255,170,122,0.14)]" />
    </div>
  );
}

function useResolvedBusHeading({
  heading,
  trail,
}: {
  heading: number | null;
  trail: TelemetryPoint[];
}) {
  return useMemo(() => {
    if (typeof heading === "number" && Number.isFinite(heading)) {
      return normalizeBearing(heading);
    }

    const lastTrailHeading = trail[trail.length - 1]?.heading;
    if (typeof lastTrailHeading === "number" && Number.isFinite(lastTrailHeading)) {
      return normalizeBearing(lastTrailHeading);
    }

    return getHeadingFromTrail(trail) ?? 0;
  }, [heading, trail]);
}

function getHeadingFromTrail(trail: TelemetryPoint[]) {
  for (let index = trail.length - 1; index > 0; index -= 1) {
    const currentPoint = trail[index];
    const previousPoint = trail[index - 1];

    if (
      currentPoint.latitude === previousPoint.latitude &&
      currentPoint.longitude === previousPoint.longitude
    ) {
      continue;
    }

    return calculateBearing(previousPoint, currentPoint);
  }

  return null;
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

function normalizeBearing(value: number) {
  return ((value % 360) + 360) % 360;
}

function OverlayCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-background/92 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
