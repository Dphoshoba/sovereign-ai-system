async function getLearning() {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
  
    const res = await fetch(
      `${base}/api/executive/executive-learning-v2`,
      { cache: "no-store" }
    );
  
    return res.json();
  }
  
  export default async function ExecutiveLearningV2Page() {
    const data = await getLearning();
    const learning = data?.learning;
  
    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Executive Learning V2
          </h1>
          <p className="text-sm text-gray-500">
            Safe V2 learning layer built from Executive Memory V2.
          </p>
        </div>
  
        <div className="grid md:grid-cols-3 gap-4">
          <Metric title="Learning Score" value={learning?.learningScore ?? 0} />
          <Metric title="Lessons" value={learning?.totalLessons ?? 0} />
          <Metric title="Memory Sources" value={learning?.sourceMemoryCount ?? 0} />
        </div>
  
        <div className="space-y-4">
          {(learning?.lessons ?? []).map((lesson: string) => (
            <div key={lesson} className="border rounded-lg p-4">
              {lesson}
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