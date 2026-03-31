"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Student = {
  id?: string;
  name?: string;
  registration?: string;
  email?: string;
  phone?: string;
  active?: boolean;
};

type Errors = Partial<Record<"name" | "registration" | "emailLocalPart" | "phone", string>>;

const emptyForm: Student = {
  name: "",
  registration: "",
  email: "",
  phone: "",
  active: true,
};

function extractEmailLocalPart(email?: string | null) {
  if (!email) return "";
  return email.split("@")[0] ?? "";
}

export function StudentModal({
  open,
  onOpenChange,
  student,
  emailDomain,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  emailDomain?: string | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<Student>(emptyForm);
  const [emailLocalPart, setEmailLocalPart] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [rfidTag, setRfidTag] = useState("");
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState("");

  const isEdit = !!student?.id;
  const resolvedEmailPreview = useMemo(() => {
    if (!emailLocalPart.trim()) {
      return emailDomain ? `@${emailDomain}` : "";
    }

    return emailDomain
      ? `${emailLocalPart.trim().toLowerCase()}@${emailDomain}`
      : emailLocalPart.trim().toLowerCase();
  }, [emailDomain, emailLocalPart]);

  useEffect(() => {
    setForm(student ?? emptyForm);
    setEmailLocalPart(extractEmailLocalPart(student?.email));
    setErrors({});
    setServerError("");
    setIsLinking(false);
    setCreatedStudent(null);
    setRfidTag("");
  }, [student, open]);

  const handleChange = (field: keyof Student, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!form.name || form.name.length < 3) {
      newErrors.name = "Nome inválido";
    }

    if (!form.registration || form.registration.length < 3) {
      newErrors.registration = "Matrícula inválida";
    }

    if (!emailLocalPart.trim()) {
      newErrors.emailLocalPart = "Informe o login do e-mail";
    } else if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i.test(emailLocalPart.trim())) {
      newErrors.emailLocalPart = "Use apenas letras, números, ponto, hífen ou underline";
    }

    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    ...form,
    name: form.name?.trim(),
    registration: form.registration?.trim(),
    email: emailLocalPart.trim().toLowerCase(),
  });

  const createStudent = async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Erro ao criar aluno");
    }

    return data;
  };

  const updateStudent = async () => {
    const res = await fetch(`http://localhost:3000/students/${student?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Erro na requisição");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Revise os campos obrigatórios antes de salvar.");
      return;
    }

    try {
      setIsSaving(true);

      if (isEdit) {
        await updateStudent();
        toast.success("Aluno atualizado com sucesso");
        onSuccess();
        onOpenChange(false);
        return;
      }

      const created = await createStudent();
      toast.success("Aluno criado com sucesso");

      setCreatedStudent(created);
      setIsLinking(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar aluno";
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!rfidTag.trim()) {
      toast.error("Informe o código RFID para concluir o vínculo.");
      return;
    }

    const studentId = createdStudent?.id ?? student?.id;

    if (!studentId) {
      toast.error("Não foi possível identificar o aluno para vincular o RFID.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/rfid/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId,
          rfidTag: rfidTag.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao vincular RFID");
      }

      toast.success("RFID vinculado com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao vincular RFID",
      );
    }
  };

  const renderError = (field: keyof Errors) => {
    if (!errors[field]) return null;
    return <p className="text-sm text-red-500">{errors[field]}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="border-b border-[#ff5c00]/10 bg-[#ff5c00]/[0.04] px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {isEdit ? "Editar aluno" : "Novo aluno"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEdit
                ? "Atualize os dados cadastrais deste aluno."
                : "Preencha os dados para criar um aluno e vincular o RFID."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="unipass-scrollbar min-h-0 space-y-6 overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
          {!isLinking ? (
            <>
              <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                    Cadastro
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {isEdit ? "Edição de aluno" : "Novo aluno"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O e-mail do aluno fica sempre amarrado ao domínio da empresa.
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    E-mail institucional
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground break-all">
                    {resolvedEmailPreview || "Defina o login do aluno"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {emailDomain
                      ? `Domínio fixo da empresa: @${emailDomain}`
                      : "Use o login que o aluno vai usar para acessar."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Nome</Label>
                  <Input
                    value={form.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={cn(
                      "h-11 rounded-xl border-border/70 bg-background px-3",
                      errors.name && "border-red-500",
                    )}
                    placeholder="Digite o nome completo"
                  />
                  {renderError("name")}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Matrícula</Label>
                  <Input
                    value={form.registration || ""}
                    onChange={(e) => handleChange("registration", e.target.value)}
                    className={cn(
                      "h-11 rounded-xl border-border/70 bg-background px-3",
                      errors.registration && "border-red-500",
                    )}
                    placeholder="Informe a matrícula"
                  />
                  {renderError("registration")}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Login do e-mail</Label>
                  <div
                    className={cn(
                      "flex min-h-11 items-center rounded-xl border border-border/70 bg-background px-3",
                      errors.emailLocalPart && "border-red-500",
                    )}
                  >
                    <input
                      value={emailLocalPart}
                      onChange={(e) => setEmailLocalPart(e.target.value)}
                      placeholder="caique.alves"
                      className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    {emailDomain && (
                      <span
                        className="max-w-[48%] shrink-0 truncate pl-3 text-sm text-muted-foreground sm:max-w-[55%]"
                        title={`@${emailDomain}`}
                      >
                        @{emailDomain}
                      </span>
                    )}
                  </div>
                  {renderError("emailLocalPart")}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input
                    value={form.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={cn(
                      "h-11 rounded-xl border-border/70 bg-background px-3",
                      errors.phone && "border-red-500",
                    )}
                    placeholder="(00) 00000-0000"
                  />
                  {renderError("phone")}
                </div>
              </div>

              {serverError && <p className="text-sm text-red-500">{serverError}</p>}

              <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="h-11 w-full cursor-pointer rounded-xl px-6 sm:w-auto"
                >
                  {isSaving
                    ? "Salvando..."
                    : isEdit
                      ? "Salvar alterações"
                      : "Criar e vincular RFID"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                    Vínculo
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Cartão do aluno
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aproxime o cartão ou informe o código RFID manualmente.
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Aluno criado
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {createdStudent?.name || "Cadastro concluído"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Finalize o processo confirmando o identificador RFID.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  Aproxime o cartão ou insira o código abaixo
                </p>

                <Input
                  placeholder="Simular RFID"
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                  className="h-11 rounded-xl border-border/70 bg-background px-3"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleConfirmLink}
                  className="h-11 w-full cursor-pointer rounded-xl px-6 sm:w-auto"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
