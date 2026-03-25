"use client";

import { useBuses } from "../hooks/useBuses";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Trash, Pencil } from "lucide-react";

export function BusesTable({ buses, deleteBus }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Placa</TableHead>
            <TableHead>Capacidade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {buses.map((bus: any) => (
            <TableRow key={bus.id}>
              <TableCell className="font-medium">{bus.plate}</TableCell>
              <TableCell>{bus.capacity}</TableCell>

              <TableCell className="text-right space-x-2">
                <Button size="icon" variant="outline">
                  <Pencil size={16} />
                </Button>

                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => deleteBus(bus.id)}
                >
                  <Trash size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {buses.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                Nenhum ônibus cadastrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
