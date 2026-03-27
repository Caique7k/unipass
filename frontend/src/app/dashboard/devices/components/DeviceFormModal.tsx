"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/services/api";

type Device = {
  id?: string;
  busId?: string | null;
  code?: string | null;
  secret?: string | null;
  hardwareId?: string;
  active?: boolean;
};

type Bus = {
  id: string;
  plate: string;
};

export function DeviceModal({
  open,
  onOpenChange,
  device,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onSuccess: () => void;
}) {
  const [pairingCode, setPairingCode] = useState("");
  const [busId, setBusId] = useState("");
  const [busSearch, setBusSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busDropdownOpen, setBusDropdownOpen] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);

  const isEditing = !!device?.id;

  useEffect(() => {
    if (!open) return;

    async function fetchBuses() {
      try {
        setLoadingBuses(true);
        const res = await api.get("/buses", {
          params: {
            page: 1,
            limit: 100,
          },
        });

        setBuses(res.data.data ?? []);
      } catch (err) {
        console.error("Erro ao buscar onibus:", err);
        setBuses([]);
      } finally {
        setLoadingBuses(false);
      }
    }

    fetchBuses();
  }, [open]);

  useEffect(() => {
    setPairingCode("");
    setBusSearch("");
    setErrorMessage("");
    setBusDropdownOpen(false);
    setBusId(device?.busId ?? "");
  }, [device, open]);

  const filteredBuses = useMemo(() => {
    const search = busSearch.trim().toLowerCase();

    if (!search) return buses;

    return buses.filter((bus) => bus.plate.toLowerCase().includes(search));
  }, [busSearch, buses]);

  const selectedBus = buses.find((bus) => bus.id === busId);
  const hasBuses = buses.length > 0;

  const handleSubmit = async () => {
    if (loading) return;

    if (!isEditing && !pairingCode.trim()) {
      setErrorMessage("Informe o codigo temporario exibido no IoT.");
      return;
    }

    if (!busId) {
      setErrorMessage("Selecione um onibus para vincular ao dispositivo.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      if (isEditing) {
        await api.patch(`/devices/${device.id}/bus`, {
          busId,
        });
      } else {
        await api.post("/devices/link", {
          pairingCode,
          busId,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const backendMessage =
          typeof err.response?.data?.message === "string"
            ? err.response.data.message
            : Array.isArray(err.response?.data?.message)
              ? err.response?.data.message.join(", ")
              : err.message;

        setErrorMessage(backendMessage || "Nao foi possivel salvar o device.");
        console.error("Erro ao salvar device:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
      } else {
        setErrorMessage("Nao foi possivel salvar o device.");
        console.error("Erro ao salvar device:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Alterar onibus do device" : "Parear dispositivo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing && (
            <Input
              placeholder="Codigo temporario exibido no IoT"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
            />
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">Onibus</div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                disabled={!hasBuses || loadingBuses}
                onClick={() => setBusDropdownOpen((prev) => !prev)}
              >
                <span className="truncate">
                  {loadingBuses
                    ? "Carregando onibus..."
                    : selectedBus?.plate || "Selecione um onibus"}
                </span>
                <ChevronsUpDown className="size-4 opacity-60" />
              </Button>

              {busDropdownOpen && hasBuses && (
                <div className="absolute z-50 mt-2 w-full rounded-md border bg-background p-2 shadow-md">
                  <Input
                    placeholder="Buscar placa..."
                    value={busSearch}
                    onChange={(e) => setBusSearch(e.target.value)}
                  />

                  <div className="mt-2 max-h-56 overflow-y-auto">
                    {filteredBuses.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum onibus encontrado.
                      </div>
                    ) : (
                      filteredBuses.map((bus) => (
                        <button
                          key={bus.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setBusId(bus.id);
                            setBusDropdownOpen(false);
                            setBusSearch("");
                          }}
                        >
                          <span>{bus.plate}</span>
                          <Check
                            className={cn(
                              "size-4",
                              bus.id === busId ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {!hasBuses && !loadingBuses && (
              <p className="text-sm text-amber-600">
                Cadastre um onibus primeiro para vincular este dispositivo.
              </p>
            )}
          </div>

          {isEditing && (
            <>
              <Input value={device.hardwareId || ""} disabled />
              <Input value={device.code || ""} disabled />
              <Input value={device.secret || ""} disabled />
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || loadingBuses || !hasBuses}
            className="w-full"
          >
            {loading
              ? "Salvando..."
              : isEditing
                ? "Salvar onibus"
                : "Parear dispositivo"}
          </Button>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
