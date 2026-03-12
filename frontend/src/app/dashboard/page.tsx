import { cookies } from "next/headers";
import { api } from "@/services/api";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return redirect("/login"); // redireciona direto se não tiver token
  }

  // busca os dados do usuário direto no server
  const res = await fetch("http://localhost:3000/auth/me", {
    headers: {
      cookie: `token=${token}`, // envia o cookie para o backend
    },
    cache: "no-store", // sempre buscar dados frescos
  });

  if (!res.ok) {
    return redirect("/login"); // se falhar, redireciona
  }

  const user = await res.json();

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Company ID: {user.companyId}</p>
    </div>
  );
}
