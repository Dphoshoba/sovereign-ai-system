import CreatorAuditForm from "./CreatorAuditForm"

export const metadata = {
  title: "Creator Automation Audit | Echoes & Visions",
  description:
    "Book a creator automation audit to identify workflow gaps, content bottlenecks and AI automation opportunities.",
}

export default function CreatorAuditPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-20 text-white md:px-12">
      <section className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
            Creator Automation Audit
          </p>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Find the systems your creator business is missing.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-300">
            Share your current creator workflow and Echoes & Visions will
            generate an AI-assisted audit covering bottlenecks, automation
            opportunities, recommended systems and next actions.
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="text-xl font-bold">Your audit will review:</h2>
            <ul className="mt-5 space-y-3 text-neutral-300">
              <li>✓ Content workflow</li>
              <li>✓ Publishing consistency</li>
              <li>✓ Lead capture gaps</li>
              <li>✓ Audience growth systems</li>
              <li>✓ AI automation opportunities</li>
            </ul>
          </div>
        </div>

        <CreatorAuditForm />
      </section>
    </main>
  )
}