"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/services/api";
import { roleLabels, type UserRole } from "@/lib/permissions";
import type { ManagedUser } from "../hooks/useUsers";

const companyRoles: UserRole[] = ["ADMIN", "DRIVER", "COORDINATOR", "USER"];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "USER" as UserRole,
};

export function UserFormModal({
  open,
  onOpenChange,
  user,
  emailDomain,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: ManagedUser | null;
  emailDomain?: string | null;
  onSuccess: () => Promise<void> | void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!user?.id;

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "USER",
    });
  }, [open, user]);

  async function handleSubmit() {
    try {
      setSaving(true);

      if (isEdit) {
        await api.patch(`/users/${user?.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Usuario atualizado com sucesso");
      } else {
        await api.post("/users", form);
        toast.success("Usuario criado com sucesso");
      }

      await onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Erro ao salvar usuario"
          : "Erro ao salvar usuario",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Novo usuario"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={
                emailDomain
                  ? `nome.sobrenome@${emailDomain}`
                  : "nome.sobrenome@empresa.com.br"
              }
            />
            {emailDomain && (
              <p className="mt-1 text-xs text-muted-foreground">
                Este usuario precisa usar o dominio da empresa: @{emailDomain}
              </p>
            )}
          </div>

          <div>
            <Label>{isEdit ? "Nova senha" : "Senha"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={isEdit ? "Preencha apenas se quiser trocar" : "Minimo de 6 caracteres"}
            />
          </div>

          <div>
            <Label>Perfil</Label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, role: value as UserRole }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companyRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={saving} className="cursor-pointer">
              {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar usuario"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
