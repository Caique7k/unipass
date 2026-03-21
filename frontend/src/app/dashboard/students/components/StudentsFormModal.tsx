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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Student = {
  id?: string;
  name?: string;
  registration?: string;
  email?: string;
  phone?: string;
  active?: boolean;
};

type StudentFormErrors = Partial<Record<keyof Student, string>>;
type StudentFormTouched = Partial<Record<keyof Student, boolean>>;

const emptyForm: Student = {
  name: "",
  registration: "",
  email: "",
  phone: "",
  active: true,
};

function normalizeForm(form: Student): Student {
  return {
    ...form,
    name: form.name?.trim() ?? "",
    registration: form.registration?.trim() ?? "",
    email: form.email?.trim() ?? "",
    phone: form.phone?.trim() ?? "",
  };
}

function validateStudentForm(form: Student): StudentFormErrors {
  const normalized = normalizeForm(form);
  const errors: StudentFormErrors = {};

  if (!normalized.name) {
    errors.name = "Informe o nome do aluno.";
  } else if (normalized.name.length < 3) {
    errors.name = "O nome precisa ter pelo menos 3 caracteres.";
  }

  if (!normalized.registration) {
    errors.registration = "Informe a matricula.";
  } else if (normalized.registration.length < 3) {
    errors.registration = "A matricula parece curta demais.";
  }

  if (!normalized.email) {
    errors.email = "Informe um email.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized.email)) {
      errors.email = "Digite um email valido, como nome@exemplo.com.";
    }
  }

  if (!normalized.phone) {
    errors.phone = "Informe um telefone.";
  } else {
    const digits = normalized.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      errors.phone = "Digite um telefone com DDD, com 10 ou 11 numeros.";
    }
  }

  return errors;
}

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
  const [touched, setTouched] = useState<StudentFormTouched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = !!student?.id;
  const errors = validateStudentForm(form);
  const visibleErrors: StudentFormErrors = submitAttempted
    ? errors
    : Object.fromEntries(
        Object.entries(errors).filter(([field]) => touched[field as keyof Student]),
      );
  useEffect(() => {
    setForm(student ? normalizeForm({ ...emptyForm, ...student }) : emptyForm);
    setTouched({});
    setSubmitAttempted(false);
    setServerError("");
  }, [student, open]);

  const handleChange = (field: keyof Student, value: string) => {
    setServerError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof Student) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    const normalizedForm = normalizeForm(form);
    const formErrors = validateStudentForm(normalizedForm);

    setForm(normalizedForm);
    setSubmitAttempted(true);

    if (Object.keys(formErrors).length > 0) {
      setTouched({
        name: true,
        registration: true,
        email: true,
        phone: true,
      });
      return;
    }

    try {
      setIsSaving(true);

      const url = isEdit
        ? `http://localhost:3000/students/${student?.id}`
        : "http://localhost:3000/students";

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(normalizedForm),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setServerError(
        "Nao foi possivel salvar o aluno. Revise os dados e tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTouched({});
      setSubmitAttempted(false);
      setServerError("");
      setForm(student ? normalizeForm({ ...emptyForm, ...student }) : emptyForm);
    }

    onOpenChange(nextOpen);
  };

  const renderFieldError = (field: keyof Student) => {
    const message = visibleErrors[field];

    if (!message) return null;

    return <p className="mt-1 text-sm text-destructive">{message}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.name ?? ""}
              aria-invalid={!!visibleErrors.name}
              className={cn(visibleErrors.name && "border-destructive")}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="Ex.: Maria Silva"
            />
            {renderFieldError("name")}
          </div>

          <div>
            <Label>Matricula</Label>
            <Input
              value={form.registration ?? ""}
              aria-invalid={!!visibleErrors.registration}
              className={cn(visibleErrors.registration && "border-destructive")}
              onChange={(e) => handleChange("registration", e.target.value)}
              onBlur={() => handleBlur("registration")}
              placeholder="Ex.: 202400123"
            />
            {renderFieldError("registration")}
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email ?? ""}
              aria-invalid={!!visibleErrors.email}
              className={cn(visibleErrors.email && "border-destructive")}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="nome@escola.com"
            />
            {renderFieldError("email")}
          </div>

          <div>
            <Label>Telefone</Label>
            <Input
              type="tel"
              value={form.phone ?? ""}
              aria-invalid={!!visibleErrors.phone}
              className={cn(visibleErrors.phone && "border-destructive")}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder="(11) 99999-9999"
            />
            {renderFieldError("phone")}
          </div>

          {serverError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <Button
            onClick={handleSubmit}
            className="w-full cursor-pointer"
            disabled={isSaving}
          >
            {isSaving
              ? "Salvando..."
              : isEdit
                ? "Salvar alteracoes"
                : "Criar aluno"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
