async function getAlerts() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/executive-alerts`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function ExecutiveAlertsPage() {
  const data = await getAlerts();
  const alerts = data?.alerts;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Alerts
        </h1>
        <p className="text-sm text-gray-500">
          Critical executive warnings and recommended recovery actions.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric title="Total" value={alerts?.total ?? 0} />
        <Metric title="Critical" value={alerts?.critical ?? 0} />
        <Metric title="Warnings" value={alerts?.warnings ?? 0} />
        <Metric title="Info" value={alerts?.info ?? 0} />
      </div>

      <div className="space-y-4">
        {(alerts?.alerts ?? []).map((alert: any) => (
          <div
            key={alert.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between gap-4">
              <h2 className="font-semibold">{alert.title}</h2>
              <span className="border rounded px-2 py-1 text-sm">
                {alert.severity}
              </span>
            </div>

            <p>{alert.message}</p>

            <p className="text-sm text-gray-500">
              {alert.recommendedAction}
            </p>
          </div>
        ))}
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