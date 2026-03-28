"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleLabels } from "@/lib/permissions";
import type { ManagedUser } from "../hooks/useUsers";
import type { UserRole } from "@/lib/permissions";
import type { UserStatusFilter } from "../hooks/useUsers";

export function UsersTable({
  data,
  page,
  setPage,
  lastPage,
  search,
  setSearch,
  status,
  setStatus,
  roleFilter,
  setRoleFilter,
  onEdit,
  onDeactivate,
}: {
  data: ManagedUser[];
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  search: string;
  setSearch: (value: string) => void;
  status: UserStatusFilter;
  setStatus: (value: UserStatusFilter) => void;
  roleFilter: UserRole | "Todos";
  setRoleFilter: (value: UserRole | "Todos") => void;
  onEdit: (user: ManagedUser) => void;
  onDeactivate: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const validSelected = useMemo(
    () =>
      selected.filter((id) => data.some((user) => user.id === id && user.active)),
    [data, selected],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(lastPage, page + 2);

  for (let index = start; index <= end; index++) {
    pages.push(index);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Pesquisar por nome, email ou perfil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as UserStatusFilter)}
          >
            <SelectTrigger className="w-[170px] cursor-pointer">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Ativos">Ativos</SelectItem>
              <SelectItem value="Inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as UserRole | "Todos")}
          >
            <SelectTrigger className="w-[190px] cursor-pointer">
              <SelectValue placeholder="Filtrar perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os perfis</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="DRIVER">Motorista</SelectItem>
              <SelectItem value="COORDINATOR">Coordenador</SelectItem>
              <SelectItem value="USER">Aluno</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="destructive"
          disabled={validSelected.length === 0}
          onClick={() => onDeactivate(validSelected)}
          className="cursor-pointer"
        >
          Desativar selecionados ({validSelected.length})
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  Nenhum usuario encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow
                  key={user.id}
                  onDoubleClick={() => onEdit(user)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Checkbox
                      checked={validSelected.includes(user.id)}
                      disabled={!user.active}
                      onCheckedChange={() => toggleSelect(user.id)}
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleLabels[user.role]}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        user.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            />
          </PaginationItem>

          {pages.map((currentPage) => (
            <PaginationItem key={currentPage}>
              <PaginationLink
                isActive={currentPage === page}
                onClick={() => setPage(currentPage)}
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(page + 1)}
              disabled={page === lastPage}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
