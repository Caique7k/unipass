"use client";

import { useEffect, useState } from "react";
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

type Errors = Partial<Record<keyof Student, string>>;

const emptyForm: Student = {
  name: "",
  registration: "",
  email: "",
  phone: "",
  active: true,
};

export function StudentModal({
  open,
  onOpenChange,
  student,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<Student>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [rfidTag, setRfidTag] = useState("");
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [serverError, setServerError] = useState("");

  const isEdit = !!student?.id;

  useEffect(() => {
    setForm(student ?? emptyForm);
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
      newErrors.registration = "Matricula invalida";
    }

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createStudent = async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
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
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Erro na requisicao");
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

      const student = await createStudent();
      toast.success("Aluno criado com sucesso");

      setCreatedStudent(student);
      setIsLinking(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar aluno");
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

  const renderError = (field: keyof Student) => {
    if (!errors[field]) return null;
    return <p className="text-sm text-red-500">{errors[field]}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
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

        <div className="space-y-6 bg-background px-6 py-6">
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
                    Confira nome, matrícula e contato antes de salvar.
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Proxima etapa
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {isEdit ? "Atualizacao imediata" : "Vinculo com RFID"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                      ? "As alteracoes sao salvas direto no cadastro."
                      : "Depois do cadastro você confirma o cartão do aluno."}
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
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    value={form.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background px-3"
                    placeholder="aluno@empresa.com.br"
                  />
                  {renderError("email")}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input
                    value={form.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background px-3"
                    placeholder="(00) 00000-0000"
                  />
                  {renderError("phone")}
                </div>
              </div>

              {serverError && <p className="text-sm text-red-500">{serverError}</p>}

              <div className="flex justify-end border-t border-border/60 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="h-11 rounded-xl px-6 cursor-pointer"
                >
                  {isSaving
                    ? "Salvando..."
                    : isEdit
                      ? "Salvar alteracoes"
                      : "Criar e vincular RFID"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                    Vinculo
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Cartao do aluno
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
                    {createdStudent?.name || "Cadastro concluido"}
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

              <div className="flex justify-end border-t border-border/60 pt-2">
                <Button
                  onClick={handleConfirmLink}
                  className="h-11 rounded-xl px-6 cursor-pointer"
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
