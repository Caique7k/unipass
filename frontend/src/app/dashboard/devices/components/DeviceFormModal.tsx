"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import api from "@/services/api";

type Device = {
  id?: string;
  name?: string;
  identifier?: string;
  code?: string;
  secret?: string;
  active?: boolean;
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
  const [form, setForm] = useState<Device>({
    name: "",
    identifier: "",
    code: "",
    secret: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (device) {
      setForm(device);
    } else {
      setForm({
        name: "",
        identifier: "",
        code: "",
        secret: "",
      });
    }
  }, [device]);

  const handleChange = (field: keyof Device, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (device?.id) {
        await api.patch(`/devices/${device.id}`, form);
      } else {
        await api.post("/devices", form);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar device", err);
    } finally {
      setLoading(false);
    }
  };

  const generateCredentials = () => {
    setForm((prev) => ({
      ...prev,
      code: crypto.randomUUID(),
      secret: crypto.randomUUID(),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{device ? "Editar device" : "Novo device"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <Input
            placeholder="Identifier (único)"
            value={form.identifier}
            onChange={(e) => handleChange("identifier", e.target.value)}
          />

          <div className="flex gap-2">
            <Input
              placeholder="Code"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />

            <Button
              type="button"
              variant="outline"
              onClick={generateCredentials}
            >
              Gerar
            </Button>
          </div>

          <Input
            placeholder="Secret"
            value={form.secret}
            onChange={(e) => handleChange("secret", e.target.value)}
          />

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
