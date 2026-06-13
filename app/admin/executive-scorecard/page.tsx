async function getScorecard() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/executive-scorecard`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function ExecutiveScorecardPage() {
  const data = await getScorecard();
  const scorecard = data?.scorecard;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Scorecard
        </h1>
        <p className="text-sm text-gray-500">
          Unified executive KPI dashboard.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric title="Overall" value={scorecard?.overallHealth ?? 0} />
        <Metric title="Finance" value={scorecard?.finance ?? 0} />
        <Metric title="Operations" value={scorecard?.operations ?? 0} />
        <Metric title="Strategy" value={scorecard?.strategy ?? 0} />
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold">Status</h2>
        <div className="text-3xl font-bold">
          {scorecard?.status ?? "Unknown"}
        </div>
        <p className="text-sm text-gray-500">
          Critical Alerts: {scorecard?.criticalAlerts ?? 0} / Total Alerts:{" "}
          {scorecard?.totalAlerts ?? 0}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Top Priorities" items={scorecard?.priorities} />
        <Section title="Top Risks" items={scorecard?.risks} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Next 30 Days" items={scorecard?.next30Days} />
        <Section title="Next 60 Days" items={scorecard?.next60Days} />
        <Section title="Next 90 Days" items={scorecard?.next90Days} />
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

function Section({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-semibold mb-3">{title}</h2>

      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-500">No items yet.</p>
      ) : (
        <ul className="list-disc pl-5 space-y-2">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}