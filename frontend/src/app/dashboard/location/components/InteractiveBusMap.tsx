"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flag, Gauge, LoaderCircle, LocateFixed, Navigation, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TelemetryPoint } from "../types";

type LeafletMap = {
  flyTo: (
    latLng: [number, number],
    zoom?: number,
    options?: { animate?: boolean; duration?: number },
  ) => void;
  setView: (latLng: [number, number], zoom: number) => void;
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (latLng: [number, number]) => void;
};

type LeafletPolyline = {
  addTo: (map: LeafletMap) => LeafletPolyline;
  setLatLngs: (latLngs: [number, number][]) => void;
};

type LeafletTileLayer = {
  addTo: (map: LeafletMap) => LeafletTileLayer;
};

type LeafletControl = {
  addTo: (map: LeafletMap) => LeafletControl;
};

type LeafletGlobal = {
  map: (
    element: HTMLDivElement,
    options: { zoomControl?: boolean; attributionControl?: boolean; preferCanvas?: boolean },
  ) => LeafletMap;
  marker: (
    latLng: [number, number],
    options: { icon: unknown },
  ) => LeafletMarker;
  polyline: (
    latLngs: [number, number][],
    options: {
      color: string;
      weight: number;
      opacity: number;
      lineCap: "round";
      lineJoin: "round";
    },
  ) => LeafletPolyline;
  tileLayer: (
    urlTemplate: string,
    options: {
      attribution: string;
      maxZoom: number;
      subdomains?: string;
    },
  ) => LeafletTileLayer;
  divIcon: (options: {
    className: string;
    html: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  }) => unknown;
  control: {
    zoom: (options?: { position?: string }) => LeafletControl;
  };
};

function getLeaflet() {
  return (window as Window & { L?: LeafletGlobal }).L;
}

function ensureLeafletCss() {
  const existing = document.querySelector('link[data-leaflet="true"]');
  if (existing) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.setAttribute("data-leaflet", "true");
  document.head.appendChild(link);
}

function ensureMapStyles() {
  if (document.querySelector('style[data-unipass-map="true"]')) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-unipass-map", "true");
  style.textContent = `
    .unipass-leaflet-map {
      height: 100%;
      width: 100%;
      background: #d9ddd3;
    }
    .unipass-leaflet-map .leaflet-control-zoom {
      border: 0;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
      overflow: hidden;
      border-radius: 18px;
    }
    .unipass-leaflet-map .leaflet-control-zoom a {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.92);
      width: 38px;
      height: 38px;
      line-height: 38px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .unipass-bus-marker {
      position: relative;
      width: 58px;
      height: 58px;
    }
    .unipass-bus-marker::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(255, 92, 0, 0.30), rgba(255, 92, 0, 0.06));
      animation: unipassPulse 1.4s ease-in-out infinite;
    }
    .unipass-bus-marker::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 30px;
      height: 30px;
      transform: translate(-50%, -50%) rotate(-12deg);
      background: linear-gradient(180deg, #ff9a5a 0%, #ff5c00 100%);
      clip-path: polygon(50% 0%, 100% 100%, 50% 76%, 0% 100%);
      box-shadow: 0 14px 30px rgba(255, 92, 0, 0.45);
      animation: unipassBusBounce 1.1s ease-in-out infinite;
    }
    .unipass-bus-core {
      position: absolute;
      left: 50%;
      top: 58%;
      width: 10px;
      height: 10px;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: white;
      z-index: 2;
    }
    @keyframes unipassPulse {
      0%, 100% { transform: scale(0.92); opacity: 0.55; }
      50% { transform: scale(1.18); opacity: 1; }
    }
    @keyframes unipassBusBounce {
      0%, 100% { transform: translate(-50%, -50%) rotate(-12deg) scale(1); }
      50% { transform: translate(-50%, -58%) rotate(-12deg) scale(1.08); }
    }
  `;
  document.head.appendChild(style);
}

function loadLeafletScript() {
  return new Promise<LeafletGlobal>((resolve, reject) => {
    const current = getLeaflet();
    if (current) {
      resolve(current);
      return;
    }

    const existing = document.querySelector(
      'script[data-leaflet-script="true"]',
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => {
        const loaded = getLeaflet();
        if (loaded) {
          resolve(loaded);
          return;
        }
        reject(new Error("Não foi possível inicializar o mapa."));
      });
      existing.addEventListener("error", () => {
        reject(new Error("Não foi possível carregar o mapa."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-leaflet-script", "true");
    script.onload = () => {
      const loaded = getLeaflet();
      if (loaded) {
        resolve(loaded);
        return;
      }
      reject(new Error("Não foi possível inicializar o mapa."));
    };
    script.onerror = () => reject(new Error("Não foi possível carregar o mapa."));
    document.body.appendChild(script);
  });
}

function createBusIcon(leaflet: LeafletGlobal) {
  return leaflet.divIcon({
    className: "unipass-bus-icon-shell",
    html: `
      <div class="unipass-bus-marker">
        <div class="unipass-bus-core"></div>
      </div>
    `,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
  });
}

export function InteractiveBusMap({
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
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);
  const trailCoordinates = useMemo<[number, number][]>(
    () => trail.map((point) => [point.latitude, point.longitude]),
    [trail],
  );

  useEffect(() => {
    let mounted = true;

    async function setupMap() {
      if (!mapElementRef.current) {
        return;
      }

      try {
        setMapError(null);
        ensureLeafletCss();
        ensureMapStyles();
        const leaflet = await loadLeafletScript();

        if (!mounted || !mapElementRef.current) {
          return;
        }

        if (!mapRef.current) {
          const map = leaflet.map(mapElementRef.current, {
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true,
          });

          leaflet
            .tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
              attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
              maxZoom: 20,
              subdomains: "abcd",
            })
            .addTo(map);

          leaflet.control.zoom({ position: "topright" }).addTo(map);

          const marker = leaflet
            .marker(center, {
              icon: createBusIcon(leaflet),
            })
            .addTo(map);

          const polyline = leaflet
            .polyline(trailCoordinates, {
              color: "#ff5c00",
              weight: 6,
              opacity: 0.88,
              lineCap: "round",
              lineJoin: "round",
            })
            .addTo(map);

          map.setView(center, 16);
          requestAnimationFrame(() => map.invalidateSize());

          mapRef.current = map;
          markerRef.current = marker;
          polylineRef.current = polyline;
        } else {
          markerRef.current?.setLatLng(center);
          polylineRef.current?.setLatLngs(trailCoordinates);
          mapRef.current.flyTo(center, 16, {
            animate: true,
            duration: 1.2,
          });
        }
      } catch (error) {
        if (mounted) {
          setMapError(
            error instanceof Error ? error.message : "Não foi possível carregar o mapa.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingMap(false);
        }
      }
    }

    setupMap();

    return () => {
      mounted = false;
    };
  }, [center, trailCoordinates]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  function recenterMap() {
    mapRef.current?.flyTo(center, 16, {
      animate: true,
      duration: 1.1,
    });
  }

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[30px] bg-[#d9ddd3] shadow-sm ring-1 ring-border/60">
      <div ref={mapElementRef} className="unipass-leaflet-map absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black/28 via-black/8 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_28%,rgba(19,24,32,0.12))]" />

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
          className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            stale
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
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
          A linha laranja mostra a rota recente acumulada nesta sessão.
        </p>
      </div>

      {loadingMap && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <LoaderCircle className="size-4 animate-spin text-[#ff5c00]" />
            Carregando mapa...
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-6">
          <div className="max-w-sm rounded-2xl bg-background px-5 py-4 text-center shadow-sm ring-1 ring-border/60">
            <p className="text-sm font-medium text-red-600">{mapError}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Confira sua conexão para carregar os blocos do mapa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function OverlayCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
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
