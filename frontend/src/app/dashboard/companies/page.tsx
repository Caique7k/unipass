"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Card } from "@/components/ui/card";
import api from "@/services/api";

type Company = {
  id: string;
  name: string;
  cnpj: string;
  emailDomain: string;
  _count: {
    users: number;
    students: number;
    buses: number;
    devices: number;
  };
};

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "PLATFORM_ADMIN") {
      setLoading(false);
      return;
    }

    async function fetchCompanies() {
      try {
        const res = await api.get("/companies");
        setCompanies(res.data);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, [user?.role]);

  if (user?.role !== "PLATFORM_ADMIN") {
    return (
      <AccessDenied description="Somente o dono da plataforma pode acessar a visão global de empresas." />
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando empresas...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Empresas cadastradas</h1>
        <p className="text-sm text-muted-foreground">
          Visão global da plataforma UniPass.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold">{company.name}</h2>
              <p className="text-sm text-muted-foreground">{company.cnpj}</p>
              <p className="text-sm text-muted-foreground">
                Domínio: @{company.emailDomain}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Usuários</p>
                <p className="font-semibold">{company._count.users}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Alunos</p>
                <p className="font-semibold">{company._count.students}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ônibus</p>
                <p className="font-semibold">{company._count.buses}</p>
              </div>
              <div>
                <p className="text-muted-foreground">UniHubs</p>
                <p className="font-semibold">{company._count.devices}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
