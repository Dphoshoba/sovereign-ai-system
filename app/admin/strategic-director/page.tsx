async function getDirector() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"

  const res = await fetch(
    `${base}/api/executive/strategic-director`,
    { cache: "no-store" }
  )

  return res.json()
}

export default async function StrategicDirectorPage() {
  const data = await getDirector()
  const director = data?.director

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Strategic Director
        </h1>
        <p className="text-sm text-gray-500">
          Company-wide executive strategy layer.
        </p>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold">Company Health</h2>
        <div className="text-4xl font-bold">
          {director?.companyHealth ?? 0}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Priorities" items={director?.priorities} />
        <Section title="Risks" items={director?.risks} />
        <Section title="Directives" items={director?.directives} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Next 30 Days" items={director?.next30Days} />
        <Section title="Next 60 Days" items={director?.next60Days} />
        <Section title="Next 90 Days" items={director?.next90Days} />
      </div>
    </main>
  )
}

function Section({
  title,
  items,
}: {
  title: string
  items?: string[]
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
  )
}