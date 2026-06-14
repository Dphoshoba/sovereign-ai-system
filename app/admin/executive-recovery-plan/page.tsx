async function getRecoveryPlan() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/executive-recovery-plan`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function ExecutiveRecoveryPlanPage() {
  const data = await getRecoveryPlan();
  const plan = data?.recoveryPlan;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Recovery Plan
        </h1>
        <p className="text-sm text-gray-500">
          Recovery actions for critical executive health.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric title="Status" value={plan?.status ?? "Unknown"} />
        <Metric title="Health" value={plan?.overallHealth ?? 0} />
        <Metric title="Mode" value={plan?.recoveryMode ?? "none"} />
        <Metric title="Critical Alerts" value={plan?.criticalAlerts ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Immediate Actions" items={plan?.immediateActions} />
        <Section title="Success Criteria" items={plan?.successCriteria} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Finance Recovery" items={plan?.financeRecovery} />
        <Section title="Operations Recovery" items={plan?.operationsRecovery} />
        <Section title="Strategy Recovery" items={plan?.strategyRecovery} />
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="text-2xl font-bold break-words">{value}</div>
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