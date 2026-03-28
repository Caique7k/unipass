"use client";

import { Card } from "@/components/ui/card";

export function AccessDenied({
  title = "Acesso restrito",
  description = "Seu perfil não tem permissão para acessar esta área.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
