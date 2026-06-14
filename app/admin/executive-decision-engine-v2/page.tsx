async function getDecisions() {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
  
    const res = await fetch(
      `${base}/api/executive/executive-decision-engine-v2`,
      { cache: "no-store" }
    );
  
    return res.json();
  }
  
  export default async function ExecutiveDecisionEngineV2Page() {
    const data = await getDecisions();
    const decisions = data?.decisions;
  
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Executive Decision Engine V2
          </h1>
  
          <p className="text-sm text-gray-500">
            Recommended executive decisions generated from forecasting and learning.
          </p>
        </div>
  
        <div className="grid md:grid-cols-3 gap-4">
          <Metric title="Decision Score" value={decisions?.decisionScore ?? 0} />
          <Metric title="Confidence" value={decisions?.confidence ?? 0} />
          <Metric
            title="Decisions"
            value={decisions?.recommendedDecisions?.length ?? 0}
          />
        </div>
  
        <div className="space-y-4">
          {(decisions?.recommendedDecisions ?? []).map(
            (decision: string) => (
              <div
                key={decision}
                className="border rounded-lg p-4"
              >
                {decision}
              </div>
            )
          )}
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