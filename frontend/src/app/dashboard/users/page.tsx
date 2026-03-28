"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserRole } from "@/lib/permissions";
import api from "@/services/api";
import { toast } from "sonner";
import {
  useUsers,
  type ManagedUser,
  type UserStatusFilter,
} from "./hooks/useUsers";
import { UsersTable } from "./components/UsersTable";
import { UserFormModal } from "./components/UserFormModal";

export default function UsersPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatusFilter>("Ativos");
  const [roleFilter, setRoleFilter] = useState<UserRole | "Todos">("Todos");
  const { data, loading, refetch, page, setPage, lastPage } = useUsers(
    canManage,
    search,
    status,
    roleFilter,
  );
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  if (!canManage) {
    return (
      <AccessDenied description="Somente o administrador da empresa pode cadastrar e gerenciar usuarios." />
    );
  }

  async function handleDeactivate(ids: string[]) {
    try {
      await api.patch("/users/deactivate", { ids });
      toast.success("Usuários desativados com sucesso");
      await refetch();
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? "Erro ao desativar usuarios")
          : "Erro ao desativar usuarios",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre administradores, motoristas, coordenadores e alunos da sua
          empresa.
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">Dominio da empresa</p>
          <div className="mt-2 inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            @{user.emailDomain}
          </div>
        </div>

        <Button
          onClick={() => {
            setSelectedUser(null);
            setOpen(true);
          }}
          className="cursor-pointer"
        >
          + Novo usuario
        </Button>
      </Card>

      <Card className="p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Carregando usuarios...
          </p>
        ) : (
          <UsersTable
            data={data}
            page={page}
            setPage={setPage}
            lastPage={lastPage}
            search={search}
            setSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            status={status}
            setStatus={(value) => {
              setStatus(value);
              setPage(1);
            }}
            roleFilter={roleFilter}
            setRoleFilter={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            onEdit={(managedUser) => {
              setSelectedUser(managedUser);
              setOpen(true);
            }}
            onDeactivate={handleDeactivate}
          />
        )}
      </Card>

      <UserFormModal
        open={open}
        onOpenChange={setOpen}
        user={selectedUser}
        emailDomain={user.emailDomain}
        onSuccess={refetch}
      />
    </div>
  );
}
