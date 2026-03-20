import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContent } from "./components/DashboardContent";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema UniPass
          </p>
        </div>

        <div className="text-sm text-muted-foreground">Atualizado agora</div>
      </div>

      <DashboardContent />
    </div>
  );
}
