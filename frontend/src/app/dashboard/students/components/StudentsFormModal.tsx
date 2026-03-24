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

  // ✅ VALIDAÇÃO (voltou, do jeito certo)
  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!form.name || form.name.length < 3) {
      newErrors.name = "Nome inválido";
    }

    if (!form.registration || form.registration.length < 3) {
      newErrors.registration = "Matrícula inválida";
    }

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email inválido";
    }

    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ CREATE
  const createStudent = async () => {
    const res = await fetch("http://localhost:3000/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (!res.ok) throw new Error(await res.text());

    return res.json();
  };

  // ✅ UPDATE
  const updateStudent = async () => {
    const res = await fetch(`http://localhost:3000/students/${student?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (!res.ok) throw new Error(await res.text());
  };

  // 🚀 BOTÃO PRINCIPAL
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSaving(true);

      if (isEdit) {
        await updateStudent();
        onSuccess();
        onOpenChange(false);
        return;
      }

      // 🔥 fluxo criação + RFID
      const student = await createStudent();
      setCreatedStudent(student);
      setIsLinking(true);
    } catch (err) {
      console.error(err);
      setServerError("Erro ao salvar aluno");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔗 RFID
  const handleConfirmLink = async () => {
    try {
      await fetch("http://localhost:3000/rfid/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: createdStudent?.id,
          rfidTag,
        }),
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setServerError("Erro ao vincular RFID");
    }
  };

  const renderError = (field: keyof Student) => {
    if (!errors[field]) return null;
    return <p className="text-sm text-red-500">{errors[field]}</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isLinking ? (
            <>
              <div className="md:col-span-2">
                <Label>Nome</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={cn(errors.name && "border-red-500")}
                />
                {renderError("name")}
              </div>

              <div>
                <Label>Matrícula</Label>
                <Input
                  value={form.registration || ""}
                  onChange={(e) => handleChange("registration", e.target.value)}
                  className={cn(errors.registration && "border-red-500")}
                />
                {renderError("registration")}
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {renderError("email")}
              </div>

              <div className="md:col-span-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {renderError("phone")}
              </div>

              {serverError && (
                <p className="text-sm text-red-500">{serverError}</p>
              )}

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="p-4 cursor-pointer mt-4"
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
            <div className="space-y-4 text-center">
              <p>Aproxime o cartão</p>

              <Input
                placeholder="Simular RFID"
                value={rfidTag}
                onChange={(e) => setRfidTag(e.target.value)}
              />

              <Button onClick={handleConfirmLink} className="w-full">
                Confirmar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
