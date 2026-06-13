async function getHealth() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/executive-health`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function ExecutiveHealthPage() {
  const data = await getHealth();
  const health = data?.health;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Health
        </h1>

        <p className="text-sm text-gray-500">
          Unified company health across finance, operations and strategy.
        </p>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold">Overall Health</h2>
        <div className="text-5xl font-bold">
          {health?.overallHealth ?? 0}
        </div>
        <p>{health?.status ?? "Unknown"}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Metric title="Finance" value={health?.finance ?? 0} />
        <Metric title="Operations" value={health?.operations ?? 0} />
        <Metric title="Strategy" value={health?.strategy ?? 0} />
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}