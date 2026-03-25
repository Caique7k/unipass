"use client";

import { useState } from "react";
import { useBuses } from "../hooks/useBuses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function BusFormModal({ createBus }: any) {
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState<number>(0);

  const handleSubmit = async () => {
    await createBus({ plate, capacity });
    setPlate("");
    setCapacity(0);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Novo ônibus</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar ônibus</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Placa"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Capacidade"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />

          <Button onClick={handleSubmit} className="w-full">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
