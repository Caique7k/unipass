"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { buildApiUrl } from "@/services/api";

type GroupOption = {
  id: string;
  name: string;
  active: boolean;
};

type RouteOption = {
  id: string;
  name: string;
  active: boolean;
};

type Student = {
  id?: string;
  name?: string;
  registration?: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  groupId?: string | null;
  group?: GroupOption | null;
  routeIds?: string[];
  routes?: {
    route: RouteOption;
  }[];
};

type Errors = Partial<
  Record<
    | "name"
    | "registration"
    | "groupId"
    | "routeIds"
    | "emailLocalPart"
    | "phone",
    string
  >
>;

const emptyForm: Student = {
  name: "",
  registration: "",
  email: "",
  phone: "",
  groupId: "",
  routeIds: [],
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
  groups,
  groupsLoading,
  groupsLoaded,
  routes,
  routesLoading,
  routesLoaded,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  emailDomain?: string | null;
  groups: GroupOption[];
  groupsLoading: boolean;
  groupsLoaded: boolean;
  routes: RouteOption[];
  routesLoading: boolean;
  routesLoaded: boolean;
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
  const [groupSearch, setGroupSearch] = useState("");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [routeSearch, setRouteSearch] = useState("");
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);

  const isEdit = !!student?.id;
  const availableGroups = useMemo(() => {
    const options = new Map<string, GroupOption>();

    groups.forEach((group) => {
      options.set(group.id, group);
    });

    if (student?.group?.id && !options.has(student.group.id)) {
      options.set(student.group.id, student.group);
    }

    return Array.from(options.values());
  }, [groups, student?.group]);

  const selectedGroup = useMemo(
    () => availableGroups.find((group) => group.id === form.groupId),
    [availableGroups, form.groupId],
  );
  const filteredGroups = useMemo(() => {
    const search = groupSearch.trim().toLowerCase();

    if (!search) {
      return availableGroups;
    }

    return availableGroups.filter((group) =>
      group.name.toLowerCase().includes(search),
    );
  }, [availableGroups, groupSearch]);
  const availableRoutes = useMemo(() => {
    const options = new Map<string, RouteOption>();

    routes.forEach((route) => {
      options.set(route.id, route);
    });

    student?.routes?.forEach((studentRoute) => {
      options.set(studentRoute.route.id, studentRoute.route);
    });

    return Array.from(options.values());
  }, [routes, student?.routes]);
  const selectedRoutes = useMemo(
    () => availableRoutes.filter((route) => form.routeIds?.includes(route.id)),
    [availableRoutes, form.routeIds],
  );
  const filteredRoutes = useMemo(() => {
    const search = routeSearch.trim().toLowerCase();

    if (!search) {
      return availableRoutes;
    }

    return availableRoutes.filter((route) =>
      route.name.toLowerCase().includes(search),
    );
  }, [availableRoutes, routeSearch]);

  const resolvedEmailPreview = useMemo(() => {
    if (!emailLocalPart.trim()) {
      return emailDomain ? `@${emailDomain}` : "";
    }

    return emailDomain
      ? `${emailLocalPart.trim().toLowerCase()}@${emailDomain}`
      : emailLocalPart.trim().toLowerCase();
  }, [emailDomain, emailLocalPart]);

  useEffect(() => {
    setForm(
      student
        ? {
            ...student,
            routeIds:
              student.routes?.map((studentRoute) => studentRoute.route.id) ??
              [],
          }
        : emptyForm,
    );
    setEmailLocalPart(extractEmailLocalPart(student?.email));
    setErrors({});
    setServerError("");
    setIsLinking(false);
    setCreatedStudent(null);
    setRfidTag("");
    setGroupSearch("");
    setGroupDropdownOpen(false);
    setRouteSearch("");
    setRouteDropdownOpen(false);
  }, [student, open]);

  const handleChange = (
    field: keyof Student,
    value: Student[keyof Student],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (!form.name || form.name.length < 3) {
      newErrors.name = "Nome inválido.";
    }

    if (!form.registration || form.registration.length < 3) {
      newErrors.registration = "Matrícula inválida.";
    }

    if (!form.groupId) {
      newErrors.groupId = "Selecione um grupo";
    }

    if (!form.routeIds?.length) {
      newErrors.routeIds = "Selecione pelo menos uma rota";
    }

    if (!emailLocalPart.trim()) {
      newErrors.emailLocalPart = "Informe o login do e-mail";
    } else if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i.test(emailLocalPart.trim())) {
      newErrors.emailLocalPart =
        "Use apenas letras, números, ponto, hífen ou underline.";
    }

    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    name: form.name?.trim(),
    registration: form.registration?.trim(),
    groupId: form.groupId,
    routeIds: form.routeIds ?? [],
    email: emailLocalPart.trim().toLowerCase(),
    phone: form.phone?.trim(),
    active: form.active ?? true,
  });

  const createStudent = async () => {
    const res = await fetch(buildApiUrl("/students"), {
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
    const res = await fetch(buildApiUrl(`/students/${student?.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Erro na requisicao");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Revise os campos obrigatorios antes de salvar.");
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
      const message =
        err instanceof Error ? err.message : "Erro ao salvar aluno";
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
      const response = await fetch(buildApiUrl("/rfid/link"), {
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
      toast.error(err instanceof Error ? err.message : "Erro ao vincular RFID");
    }
  };

  const renderError = (field: keyof Errors) => {
    if (!errors[field]) return null;
    return <p className="text-sm text-red-500">{errors[field]}</p>;
  };

  const isMissingGroups =
    groupsLoaded && !groupsLoading && availableGroups.length === 0;
  const isMissingRoutes =
    routesLoaded && !routesLoading && availableRoutes.length === 0;

  const toggleRoute = (routeId: string) => {
    setForm((prev) => {
      const currentRouteIds = prev.routeIds ?? [];

      return {
        ...prev,
        routeIds: currentRouteIds.includes(routeId)
          ? currentRouteIds.filter((currentId) => currentId !== routeId)
          : [...currentRouteIds, routeId],
      };
    });
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
                : "Preencha os dados para criar um aluno, definir o grupo e vincular o RFID."}
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
                    {isEdit ? "Edicao de aluno" : "Novo aluno"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O e-mail do aluno fica sempre amarrado ao domínio da
                    empresa.
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    E-mail institucional
                  </p>
                  <p className="mt-2 break-all text-base font-semibold text-foreground">
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
                    onChange={(e) =>
                      handleChange("registration", e.target.value)
                    }
                    className={cn(
                      "h-11 rounded-xl border-border/70 bg-background px-3",
                      errors.registration && "border-red-500",
                    )}
                    placeholder="Informe a matricula"
                  />
                  {renderError("registration")}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Grupo</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-between rounded-xl border-border/70 bg-background px-3",
                        errors.groupId && "border-red-500",
                      )}
                      disabled={groupsLoading || isMissingGroups}
                      onClick={() => setGroupDropdownOpen((prev) => !prev)}
                    >
                      <span className="truncate">
                        {groupsLoading
                          ? "Carregando grupos..."
                          : selectedGroup
                            ? `${selectedGroup.name}${!selectedGroup.active ? " (inativo)" : ""}`
                            : isMissingGroups
                              ? "Cadastre um grupo primeiro"
                              : "Selecione um grupo"}
                      </span>
                      <ChevronsUpDown className="size-4 opacity-60" />
                    </Button>

                    {groupDropdownOpen &&
                      !groupsLoading &&
                      !isMissingGroups && (
                        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border/60 bg-background p-2 shadow-md">
                          <Input
                            placeholder="Buscar grupo..."
                            value={groupSearch}
                            onChange={(e) => setGroupSearch(e.target.value)}
                            className="h-10 rounded-lg"
                          />

                          <div className="mt-2 max-h-56 overflow-y-auto">
                            {filteredGroups.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                Nenhum grupo encontrado.
                              </div>
                            ) : (
                              filteredGroups.map((group) => (
                                <button
                                  key={group.id}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => {
                                    handleChange("groupId", group.id);
                                    setGroupDropdownOpen(false);
                                    setGroupSearch("");
                                  }}
                                >
                                  <span>
                                    {group.name}
                                    {!group.active ? " (inativo)" : ""}
                                  </span>
                                  <Check
                                    className={cn(
                                      "size-4",
                                      group.id === form.groupId
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  {isMissingGroups ? (
                    <p className="text-sm text-amber-600">
                      Antes de cadastrar um colaborador, e preciso cadastrar um
                      grupo.
                    </p>
                  ) : null}
                  {selectedGroup && !selectedGroup.active ? (
                    <p className="text-sm text-amber-600">
                      Este colaborador esta vinculado a um grupo inativo. Para
                      trocar o grupo, selecione um grupo ativo.
                    </p>
                  ) : null}
                  {renderError("groupId")}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Rotas</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-between rounded-xl border-border/70 bg-background px-3",
                        errors.routeIds && "border-red-500",
                      )}
                      disabled={routesLoading || isMissingRoutes}
                      onClick={() => setRouteDropdownOpen((prev) => !prev)}
                    >
                      <span className="truncate">
                        {routesLoading
                          ? "Carregando rotas..."
                          : selectedRoutes.length === 0
                            ? isMissingRoutes
                              ? "Cadastre uma rota primeiro"
                              : "Selecione as rotas"
                            : selectedRoutes.length === 1
                              ? selectedRoutes[0].name
                              : `${selectedRoutes.length} rotas selecionadas`}
                      </span>
                      <ChevronsUpDown className="size-4 opacity-60" />
                    </Button>

                    {routeDropdownOpen &&
                      !routesLoading &&
                      !isMissingRoutes && (
                        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border/60 bg-background p-2 shadow-md">
                          <Input
                            placeholder="Buscar rota..."
                            value={routeSearch}
                            onChange={(e) => setRouteSearch(e.target.value)}
                            className="h-10 rounded-lg"
                          />

                          <div className="mt-2 max-h-56 overflow-y-auto">
                            {filteredRoutes.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                Nenhuma rota encontrada.
                              </div>
                            ) : (
                              filteredRoutes.map((route) => (
                                <button
                                  key={route.id}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => toggleRoute(route.id)}
                                >
                                  <span>
                                    {route.name}
                                    {!route.active ? " (inativa)" : ""}
                                  </span>
                                  <Check
                                    className={cn(
                                      "size-4",
                                      form.routeIds?.includes(route.id)
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  {selectedRoutes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRoutes.map((route) => (
                        <span
                          key={route.id}
                          className="rounded-full bg-muted px-3 py-1 text-xs text-foreground"
                        >
                          {route.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {isMissingRoutes ? (
                    <p className="text-sm text-amber-600">
                      Antes de definir notificacoes, e preciso cadastrar pelo
                      menos uma rota.
                    </p>
                  ) : null}
                  {renderError("routeIds")}
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

                <div className="space-y-2">
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

              {serverError && (
                <p className="text-sm text-red-500">{serverError}</p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSaving ||
                    groupsLoading ||
                    isMissingGroups ||
                    routesLoading ||
                    isMissingRoutes
                  }
                  className="h-11 w-full cursor-pointer rounded-xl px-6 sm:w-auto"
                >
                  {groupsLoading
                    ? "Carregando grupos..."
                    : routesLoading
                      ? "Carregando rotas..."
                      : isMissingGroups
                        ? "Cadastre um grupo primeiro"
                        : isMissingRoutes
                          ? "Cadastre uma rota primeiro"
                          : isSaving
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
                  Aproxime o cartão ou insira o código abaixo.
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
