async function getJson(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
  });

  return res.json();
}

export default async function MissionControlPage() {
  const [
    healthData,
    alertsData,
    scorecardData,
    directorData,
    approvalsData,
    executionData,
  ] = await Promise.all([
    getJson("/api/executive/executive-health"),
    getJson("/api/executive/executive-alerts"),
    getJson("/api/executive/executive-scorecard"),
    getJson("/api/executive/strategic-director"),
    getJson("/api/executive/action-approvals"),
    getJson("/api/executive/action-execution"),
  ]);

  const health = healthData?.health;
  const alerts = alertsData?.alerts;
  const scorecard = scorecardData?.scorecard;
  const director = directorData?.director;
  const approvals = approvalsData?.approvals;
  const execution = executionData?.execution;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Mission Control
        </h1>
        <p className="text-sm text-gray-500">
          CEO cockpit for health, alerts, strategy, approvals and execution.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric title="Overall Health" value={health?.overallHealth ?? 0} />
        <Metric title="Finance" value={health?.finance ?? 0} />
        <Metric title="Operations" value={health?.operations ?? 0} />
        <Metric title="Strategy" value={health?.strategy ?? 0} />
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric title="Alerts" value={alerts?.total ?? 0} />
        <Metric title="Critical" value={alerts?.critical ?? 0} />
        <Metric title="Pending Approvals" value={approvals?.pending ?? 0} />
        <Metric title="Ready Actions" value={execution?.ready ?? 0} />
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold">Executive Status</h2>
        <div className="text-3xl font-bold">
          {scorecard?.status ?? "Unknown"}
        </div>
        <p className="text-sm text-gray-500">
          Current operating mode based on finance, operations and strategy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Strategic Priorities" items={director?.priorities} />
        <Section title="Top Risks" items={director?.risks} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Next 30 Days" items={director?.next30Days} />
        <Section title="Next 60 Days" items={director?.next60Days} />
        <Section title="Next 90 Days" items={director?.next90Days} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ActionList
          title="Approval Queue"
          items={approvals?.approvals}
          statusKey="approvalStatus"
        />

        <ActionList
          title="Execution Queue"
          items={execution?.actions}
          statusKey="status"
        />
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

function ActionList({
  title,
  items,
  statusKey,
}: {
  title: string;
  items?: any[];
  statusKey: string;
}) {
  const visible = (items ?? []).slice(0, 6);

  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-semibold mb-3">{title}</h2>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">No actions yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <div key={item.id} className="border rounded p-3">
              <div className="flex justify-between gap-4">
                <strong>{item.title}</strong>
                <span className="text-sm border rounded px-2 py-1">
                  {item[statusKey]}
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                {item.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}