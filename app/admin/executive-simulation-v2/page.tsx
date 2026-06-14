async function getSimulation() {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
  
    const res = await fetch(
      `${base}/api/executive/executive-simulation-v2`,
      { cache: "no-store" }
    );
  
    return res.json();
  }
  
  export default async function ExecutiveSimulationV2Page() {
    const data = await getSimulation();
    const simulation = data?.simulation;
  
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Executive Simulation V2
          </h1>
  
          <p className="text-sm text-gray-500">
            Simulates alternative executive strategies and recommends the strongest path.
          </p>
        </div>
  
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">
            Recommended Scenario
          </h2>
  
          <div className="text-2xl font-bold mt-2">
            {simulation?.recommendedScenario?.name}
          </div>
  
          <p className="mt-2">
            {simulation?.recommendedScenario?.summary}
          </p>
        </div>
  
        <div className="space-y-4">
          {(simulation?.scenarios ?? []).map((scenario: any) => (
            <div
              key={scenario.name}
              className="border rounded-lg p-4"
            >
              <h2 className="font-semibold">
                {scenario.name}
              </h2>
  
              <div className="mt-2">
                Projected Health: {scenario.projectedHealth}
              </div>
  
              <div>
                Confidence: {scenario.confidence}
              </div>
  
              <p className="mt-2">
                {scenario.summary}
              </p>
            </div>
          ))}
        </div>
      </main>
    );
  }