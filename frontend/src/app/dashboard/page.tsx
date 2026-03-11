export default async function Dashboard() {
  await new Promise((r) => setTimeout(r, 2000));
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to UniPass</p>
    </div>
  );
}
