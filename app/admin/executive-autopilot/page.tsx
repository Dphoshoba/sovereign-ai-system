async function getAutopilot() {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
  
    const res = await fetch(
      `${base}/api/executive/executive-autopilot`,
      { cache: "no-store" }
    );
  
    return res.json();
  }
  
  export default async function ExecutiveAutopilotPage() {
    const data = await getAutopilot();
    const autopilot = data?.autopilot;
  
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Executive Autopilot
          </h1>
  
          <p className="text-sm text-gray-500">
            Automated executive actions and recovery triggers.
          </p>
        </div>
  
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">Status</h2>
  
          <div className="text-3xl font-bold">
            {autopilot?.status}
          </div>
        </div>
  
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">
            Automated Actions
          </h2>
  
          <ul className="list-disc pl-5 space-y-2">
            {(autopilot?.actions ?? []).map(
              (action: string) => (
                <li key={action}>{action}</li>
              )
            )}
          </ul>
        </div>
      </main>
    );
  }