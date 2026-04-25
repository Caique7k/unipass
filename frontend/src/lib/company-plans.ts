export type CompanyPlan = "ESSENTIAL" | "GROWTH" | "SCALE";

type CompanyPlanMeta = {
  label: string;
  eyebrow: string;
  description: string;
  features: string[];
  cardClassName: string;
  badgeClassName: string;
};

export const companyPlanOrder: CompanyPlan[] = [
  "ESSENTIAL",
  "GROWTH",
  "SCALE",
];

export const companyPlanMeta: Record<CompanyPlan, CompanyPlanMeta> = {
  ESSENTIAL: {
    label: "Essential",
    eyebrow: "Base organizada",
    description:
      "Ideal para operações em início de estruturação, com gestão clara e custo enxuto.",
    features: [
      "Cadastro central de operação e contato principal",
      "Acompanhamento diário da frota e dos usuários",
      "Fluxo simples para manter a empresa em dia",
    ],
    cardClassName:
      "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
    badgeClassName: "bg-slate-900 text-white",
  },
  GROWTH: {
    label: "Growth",
    eyebrow: "Expansão operacional",
    description:
      "Pensado para empresas que estão crescendo e precisam de mais ritmo no acompanhamento.",
    features: [
      "Mais tração para escalar equipes e jornadas",
      "Melhor visibilidade da operação para o administrador",
      "Apoio para evolução comercial com a plataforma",
    ],
    cardClassName:
      "border-[#ffd8c2] bg-[linear-gradient(180deg,#fff7f1_0%,#ffffff_100%)]",
    badgeClassName: "bg-[#ff5c00] text-white",
  },
  SCALE: {
    label: "Scale",
    eyebrow: "Operação de alta demanda",
    description:
      "Para operações maduras que precisam de acompanhamento próximo e capacidade ampliada.",
    features: [
      "Estrutura preparada para múltiplas frentes operacionais",
      "Maior previsibilidade para o dono da operação",
      "Base ideal para jornadas críticas e maior volume",
    ],
    cardClassName:
      "border-emerald-200 bg-[linear-gradient(180deg,#f1fff8_0%,#ffffff_100%)]",
    badgeClassName: "bg-emerald-600 text-white",
  },
};
