
import Link from "next/link"
import StarterPackForm from "./StarterPackForm"

export const metadata = {
  title: "AI Systems For Creators | Echoes & Visions",
  description:
    "AI-powered systems for creators who want to automate workflows, publishing, and audience growth without losing their human voice.",
}

const AUDIT_LINK = "/creator-audit"
const STARTER_PACK_LINK = "#starter-pack"

const systems = [
  {
    title: "Content Research Engine",
    body: "Turn scattered ideas into researched, structured content directions.",
  },
  {
    title: "Publishing Workflow System",
    body: "Organize drafts, schedules, channels, and publishing rhythm in one flow.",
  },
  {
    title: "Audience Intelligence Dashboard",
    body: "Understand what your audience responds to and where growth is forming.",
  },
  {
    title: "Lead Capture & Email Automation",
    body: "Convert attention into relationships, not just views.",
  },
  {
    title: "Content Repurposing Pipeline",
    body: "Turn one strong idea into posts, emails, scripts, shorts, and articles.",
  },
]

const problems = [
  "Inconsistent publishing",
  "Content burnout",
  "Scattered workflows",
  "Weak lead capture",
  "Audience stagnation",
  "Too many AI tools",
]

const process = ["Audit", "Strategy", "System Build", "Automation", "Optimization"]

const faqs = [
  {
    q: "Will AI replace my creativity?",
    a: "No. The goal is to let AI handle the repetitive systems so your voice, judgment and creativity become stronger.",
  },
  {
    q: "What tools do I need?",
    a: "That depends on your workflow. We help you choose the right stack instead of adding random tools.",
  },
  {
    q: "Can this work for small creators?",
    a: "Yes. Small creators often benefit most because automation gives them capacity without hiring too early.",
  },
  {
    q: "Do you help with workflows?",
    a: "Yes. The Creator Automation Package is built around practical workflows, publishing systems, lead capture and operational clarity.",
  },
]

export default function CreatorAutomationPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <Hero />
      <TrustStrip />
      <Problem />
      <Solution />
      <CreatorSystems />
      <Offer />
      <Process />
      <LeadMagnet />
      <Trust />
      <FAQ />
      <FinalCTA />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 px-6 py-24 text-white md:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4f46e5,transparent_35%),radial-gradient(circle_at_bottom_left,#9333ea,transparent_35%)] opacity-50" />
      <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200 backdrop-blur">
            Echoes & Visions
          </p>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            AI-powered systems for creators who want scale without losing their
            human voice.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-300 md:text-xl">
            Automate content, workflows, publishing, audience growth, and
            operations with intelligent AI systems built for authenticity and
            long-term momentum.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href={AUDIT_LINK}
              className="rounded-full bg-white px-7 py-4 font-bold text-neutral-950 shadow-xl transition hover:-translate-y-1 hover:bg-indigo-100"
            >
              Book a Creator Automation Audit
            </Link>

            <Link
              href={STARTER_PACK_LINK}
              className="rounded-full border border-white/25 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
            >
              Download Starter Pack
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-indigo-500/20 blur-2xl" />

          <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-neutral-950 p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-neutral-400">
                    Creator Operating System
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Live Workflow Map</h3>
                </div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                  ACTIVE
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {["Ideas", "Research", "Publishing", "Leads", "Analytics"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <span>{item}</span>
                      <span className="text-sm text-indigo-300">
                        0{index + 1}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4">
                <p className="text-sm leading-6 text-neutral-300">
                  One idea becomes a system: research, publish, repurpose,
                  capture, follow up, and improve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustStrip() {
  return (
    <section className="border-b border-neutral-200 bg-white px-6 py-6 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 text-sm font-semibold text-neutral-600">
        {[
          "AI Workflow Systems",
          "Creator Automation",
          "Publishing Pipelines",
          "Lead Capture",
          "Human Voice",
        ].map((item) => (
          <span key={item} className="rounded-full bg-neutral-100 px-4 py-2">
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="font-bold uppercase tracking-[0.2em] text-indigo-600">
            The problem
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Most creators are drowning in manual work.
          </h2>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            The issue is not laziness. It is not lack of ideas. It is the
            absence of a system that protects your creativity while handling the
            operational load.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {problems.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 h-10 w-10 rounded-2xl bg-indigo-100" />
              <h3 className="text-xl font-bold">{item}</h3>
              <p className="mt-3 leading-7 text-neutral-600">
                The problem is not lack of effort. It is lack of systems.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Solution() {
  return (
    <section className="bg-neutral-100 px-6 py-24 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
        <div>
          <p className="font-bold uppercase tracking-[0.2em] text-indigo-600">
            The shift
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            AI should automate the chaos, not replace your creativity.
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-lg leading-8 text-neutral-700">
            Your wisdom, voice, story, discernment, and judgment should remain
            human. AI should support the system around your creativity.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              "AI handles research, organization, repurposing, and publishing flow.",
              "You keep the insight, conviction, story, judgment, and voice.",
              "The result is more output without becoming generic.",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-neutral-100 p-5">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CreatorSystems() {
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="font-bold uppercase tracking-[0.2em] text-indigo-600">
            The systems
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            The 5 AI systems every creator eventually needs.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-5">
          {systems.map((system, index) => (
            <div
              key={system.title}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl"
            >
              <p className="text-sm font-black text-indigo-600">
                0{index + 1}
              </p>
              <h3 className="mt-5 text-lg font-bold">{system.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {system.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Offer() {
  return (
    <section className="bg-neutral-950 px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="font-bold uppercase tracking-[0.2em] text-indigo-300">
          Flagship offer
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
          The Creator Automation Package
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
          A practical system-building package for creators who want content,
          publishing, lead capture, and operations working together
          intelligently.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-5">
          {process.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h3 className="font-bold">{item}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                A focused stage that turns scattered effort into a clearer
                creator operating system.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Process() {
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl font-black tracking-tight md:text-6xl">
          How it works.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-5">
          {process.map((step, index) => (
            <div key={step} className="rounded-3xl bg-neutral-100 p-7">
              <p className="text-sm font-black text-indigo-600">
                Step {index + 1}
              </p>
              <h3 className="mt-4 text-xl font-bold">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LeadMagnet() {
  return (
    <section id="starter-pack" className="bg-indigo-50 px-6 py-24 md:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
        <div>
          <p className="font-bold uppercase tracking-[0.2em] text-indigo-600">
            Free starter pack
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Get The Creator Automation Starter Pack
          </h2>

          <p className="mt-6 text-lg leading-8 text-neutral-700">
            Download the workflow blueprint, creator AI stack, publishing
            checklist, automation roadmap, and operating system map.
          </p>

          <div className="mt-8 rounded-3xl bg-white p-7 shadow-xl">
            <ul className="space-y-4 text-neutral-700">
              <li>✓ Creator AI Stack</li>
              <li>✓ Publishing Workflow Blueprint</li>
              <li>✓ Lead Capture System</li>
              <li>✓ Content Repurposing Flow</li>
              <li>✓ Creator Operating System Map</li>
            </ul>
          </div>
        </div>

        <StarterPackForm />
      </div>
    </section>
  )
}

function Trust() {
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-bold uppercase tracking-[0.2em] text-indigo-600">
          Why this matters
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
          Built for creators who want intelligent growth.
        </h2>

        <p className="mt-6 text-lg leading-8 text-neutral-700">
          Echoes & Visions exists to help creators build with clarity, wisdom,
          operational intelligence, and human authenticity.
        </p>
      </div>
    </section>
  )
}

function FAQ() {
  return (
    <section className="bg-neutral-100 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-4xl font-black tracking-tight md:text-6xl">
          Questions creators ask.
        </h2>

        <div className="mt-12 grid gap-5">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-3xl bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold">{faq.q}</h3>
              <p className="mt-3 leading-7 text-neutral-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="bg-neutral-950 px-6 py-24 text-center text-white md:px-12">
      <p className="font-bold uppercase tracking-[0.2em] text-indigo-300">
        Ready when you are
      </p>

      <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
        Build smarter. Create better. Scale intelligently.
      </h2>

      <div className="mt-9 flex justify-center gap-4">
        <Link
          href={AUDIT_LINK}
          className="rounded-full bg-white px-7 py-4 font-bold text-neutral-950 shadow-xl transition hover:-translate-y-1 hover:bg-indigo-100"
        >
          Book Your Creator Automation Audit
        </Link>
      </div>
    </section>
  )
}
