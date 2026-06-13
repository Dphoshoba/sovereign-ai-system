async function getMemory() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/executive-memory`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function ExecutiveMemoryPage() {
  const data = await getMemory();
  const memory = data?.memory;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Executive Memory
        </h1>

        <p className="text-sm text-gray-500">
          Historical executive decisions and events.
        </p>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold">Total Memories</h2>
        <div className="text-3xl font-bold">
          {memory?.total ?? 0}
        </div>
      </div>

      <div className="space-y-4">
        {(memory?.memories ?? []).map((item: any) => (
          <div
            key={item.id}
            className="border rounded-lg p-4"
          >
            <div className="flex justify-between">
              <h2 className="font-semibold">
                {item.title}
              </h2>

              <span className="text-sm text-gray-500">
                {item.category}
              </span>
            </div>

            <p className="mt-2">
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}