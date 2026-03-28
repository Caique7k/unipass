"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { toast } from "sonner";

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
        console.error("Erro ao buscar ônibus:", err);
        setBuses([]);
        toast.error("Não foi possível carregar os ônibus.");
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
      const message = "Informe o código temporário exibido no IoT.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!busId) {
      const message = "Selecione um ônibus para vincular ao dispositivo.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      if (isEditing) {
        await api.patch(`/devices/${device.id}/bus`, {
          busId,
        });
        toast.success("Ônibus alterado com sucesso.");
      } else {
        await api.post("/devices/link", {
          pairingCode,
          busId,
        });
        toast.success("UniHub pareado com sucesso.");
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

        setErrorMessage(backendMessage || "Não foi possível salvar o dispositivo.");
        toast.error(backendMessage || "Não foi possível salvar o UniHub.");
        console.error("Erro ao salvar device:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
      } else {
        setErrorMessage("Não foi possível salvar o dispositivo.");
        toast.error("Não foi possível salvar o UniHub.");
        console.error("Erro ao salvar device:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="border-b border-[#ff5c00]/10 bg-[#ff5c00]/[0.04] px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {isEditing ? "Alterar ônibus do dispositivo" : "Parear dispositivo"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing
                ? "Atualize o ônibus vinculado a este UniHub."
                : "Informe o código temporário e escolha o ônibus para concluir o pareamento."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 bg-background px-6 py-6">
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                UniHub
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isEditing ? "Edição de vinculação" : "Novo pareamento"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isEditing
                  ? "Troque o ônibus associado sem alterar o dispositivo."
                  : "Use o código exibido no dispositivo para concluir o processo."}
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ônibus selecionado
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {selectedBus?.plate || "Nenhum ônibus escolhido"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione a placa correta antes de salvar.
              </p>
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Codigo temporario</div>
              <Input
                placeholder="Codigo temporario exibido no IoT"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                className="h-11 rounded-xl border-border/70 bg-background px-3"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">Ônibus</div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-between rounded-xl border-border/70 bg-background px-3 cursor-pointer"
                disabled={!hasBuses || loadingBuses}
                onClick={() => setBusDropdownOpen((prev) => !prev)}
              >
                <span className="truncate">
                  {loadingBuses
                    ? "Carregando ônibus..."
                    : selectedBus?.plate || "Selecione um ônibus"}
                </span>
                <ChevronsUpDown className="size-4 opacity-60" />
              </Button>

              {busDropdownOpen && hasBuses && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border border-border/60 bg-background p-2 shadow-md">
                  <Input
                    placeholder="Buscar placa..."
                    value={busSearch}
                    onChange={(e) => setBusSearch(e.target.value)}
                    className="h-10 rounded-lg"
                  />

                  <div className="mt-2 max-h-56 overflow-y-auto">
                    {filteredBuses.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum ônibus encontrado.
                      </div>
                    ) : (
                      filteredBuses.map((bus) => (
                        <button
                          key={bus.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
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
                Cadastre um ônibus primeiro para vincular este dispositivo.
              </p>
            )}
          </div>

          {isEditing && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                value={device.hardwareId || ""}
                disabled
                className="h-11 rounded-xl"
              />
              <Input value={device.code || ""} disabled className="h-11 rounded-xl" />
              <Input
                value={device.secret || ""}
                disabled
                className="h-11 rounded-xl"
              />
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <div className="flex justify-end border-t border-border/60 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || loadingBuses || !hasBuses}
              className="h-11 rounded-xl px-6 cursor-pointer"
            >
              {loading
                ? "Salvando..."
                : isEditing
                  ? "Salvar ônibus"
                  : "Parear dispositivo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
