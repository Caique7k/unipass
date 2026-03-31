"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  function validateForm() {
    if (!form.name.trim() || form.name.trim().length < 3) {
      toast.error("Informe um nome válido com pelo menos 3 caracteres.");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("Informe um e-mail para o usuário.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Informe um e-mail válido.");
      return false;
    }

    if (emailDomain) {
      const normalizedEmail = form.email.trim().toLowerCase();
      const expectedDomain = `@${emailDomain.toLowerCase()}`;

      if (!normalizedEmail.endsWith(expectedDomain)) {
        toast.error(`O e-mail deve usar o domínio ${expectedDomain}.`);
        return false;
      }
    }

    if (!isEdit && form.password.length < 6) {
      toast.error("A senha inicial precisa ter pelo menos 6 caracteres.");
      return false;
    }

    if (isEdit && form.password && form.password.length < 6) {
      toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (isEdit) {
        await api.patch(`/users/${user?.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Usuário atualizado com sucesso.");
      } else {
        await api.post("/users", {
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
        });
        toast.success("Usuário criado com sucesso.");
      }

      await onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Erro ao salvar usuário."
          : "Erro ao salvar usuário.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="border-b border-[#ff5c00]/10 bg-[#ff5c00]/[0.04] px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {isEdit ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEdit
                ? "Atualize os dados, acesso e perfil deste colaborador."
                : "Preencha os dados para liberar o acesso de um novo usuário."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="unipass-scrollbar min-h-0 space-y-6 overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                Acesso
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isEdit ? "Edição de cadastro" : "Novo cadastro"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {emailDomain
                  ? `Os usuários devem usar o domínio @${emailDomain}.`
                  : "Use um e-mail corporativo válido para este usuário."}
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Perfil selecionado
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {roleLabels[form.role]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Defina o tipo de acesso ideal antes de salvar.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Digite o nome completo"
                className="h-11 rounded-xl border-border/70 bg-background px-3"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as UserRole }))
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-border/70 bg-background px-3 cursor-pointer">
                  <SelectValue>{roleLabels[form.role]}</SelectValue>
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
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">E-mail</Label>
            <Input
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder={
                emailDomain
                  ? `nome.sobrenome@${emailDomain}`
                  : "nome.sobrenome@empresa.com.br"
              }
              className="h-11 rounded-xl border-border/70 bg-background px-3"
            />
            {emailDomain && (
              <p className="mt-1 text-xs text-muted-foreground">
                Este usuário precisa usar o domínio da empresa: @{emailDomain}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isEdit ? "Nova senha" : "Senha"}
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder={
                isEdit
                  ? "Preencha apenas se quiser trocar"
                  : "Mínimo de 6 caracteres"
              }
              className="h-11 rounded-xl border-border/70 bg-background px-3"
            />
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? "Deixe em branco para manter a senha atual."
                : "Use pelo menos 6 caracteres para o primeiro acesso."}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="h-11 w-full cursor-pointer rounded-xl px-6 sm:w-auto"
            >
              {saving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar usuário"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
