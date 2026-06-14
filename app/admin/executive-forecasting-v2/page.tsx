async function getForecast() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/executive-forecasting-v2`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function ExecutiveForecastingV2Page() {
  const data = await getForecast();
  const forecast = data?.forecast;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Forecasting V2
        </h1>

        <p className="text-sm text-gray-500">
          Predictive outlook generated from executive health and learning.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Metric title="Current" value={forecast?.currentHealth ?? 0} />
        <Metric title="30 Days" value={forecast?.forecast?.next30Days ?? 0} />
        <Metric title="60 Days" value={forecast?.forecast?.next60Days ?? 0} />
        <Metric title="90 Days" value={forecast?.forecast?.next90Days ?? 0} />
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Current Status</h2>
        <p>{forecast?.currentStatus ?? "Unknown"}</p>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Learning Score</h2>
        <div className="text-3xl font-bold">
          {forecast?.learningScore ?? 0}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Risk Outlook</h2>
        <p>{forecast?.riskOutlook}</p>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Forecast Assumptions</h2>

        <ul className="list-disc pl-5 space-y-2">
          {(forecast?.assumptions ?? []).map(
            (item: string) => (
              <li key={item}>{item}</li>
            )
          )}
        </ul>
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