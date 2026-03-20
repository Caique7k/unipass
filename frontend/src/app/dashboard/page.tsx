import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardView } from "./components/DashboardView";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return redirect("/login");
  }

  return <DashboardView />;
}
