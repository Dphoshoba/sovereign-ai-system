import Link from "next/link";

async function getConsensus() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${base}/api/executive/boardroom-consensus`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function BoardroomConsensusPage() {
  const data = await getConsensus();
  const decisions = data?.consensus?.decisions ?? [];

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Boardroom Consensus
        </h1>
        <p className="text-sm text-gray-500">
          Executive agent voting and consensus.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/agents">Agents</Link>
        <Link href="/admin/cfo">CFO</Link>
        <Link href="/admin/coo">COO</Link>
        <Link href="/admin/command-center">
          Command Center
        </Link>
      </div>

      {decisions.map((decision: any) => (
        <div
          key={decision.topic}
          className="border rounded-lg p-4 space-y-3"
        >
          <div className="flex justify-between">
            <h2 className="font-semibold">
              {decision.topic}
            </h2>

            <span className="px-2 py-1 rounded border">
              {decision.consensus}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              Approved: {decision.approvedVotes}
            </div>

            <div>
              Rejected: {decision.rejectedVotes}
            </div>

            <div>
              Neutral: {decision.neutralVotes}
            </div>
          </div>

          <div className="space-y-2">
            {decision.votes.map((vote: any) => (
              <div
                key={vote.agent}
                className="border rounded p-2"
              >
                <div>
                  <strong>{vote.agent}</strong>
                </div>

                <div>{vote.vote}</div>

                <div className="text-sm text-gray-500">
                  {vote.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}