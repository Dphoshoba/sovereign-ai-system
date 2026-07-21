import type { Metadata } from "next"
import Link from "next/link"
import NewsletterForm from "@/components/public/NewsletterForm"

export const metadata: Metadata = {
  title: "Sovereign AI | Echoes & Visions",
  description:
    "Build AI systems that remember, reason, and execute under your governance—not the other way around.",
}

const framework = [
  {
    title: "Capture",
    text: "Capture everything that matters—from ideas and documents to customer conversations and operational events.",
  },
  {
    title: "Memory",
    text: "Convert information into governed organisational knowledge that persists across people, projects, and AI agents.",
  },
  {
    title: "Execution",
    text: "Trigger intelligent workflows, publishing, automation, and decision support while keeping humans in control.",
  },
]

const problems = [
  "AI conversations disappear instead of becoming organisational knowledge.",
  "Every new tool creates another silo.",
  "Important decisions aren't governed or auditable.",
  "Content, CRM, email, and AI work independently instead of together.",
  "Automation scales activity, but not accountability.",
]

export default function SovereignAIPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="border-b border-white/10 bg-black/80 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Echoes & Visions
          </Link>

          <div className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="#video">Video</a>
            <a href="#framework">Framework</a>
            <a href="#download">Download</a>
            <a href="#newsletter">Newsletter</a>
          </div>

          <a
            href="#download"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Get Template
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-5xl">
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
            Sovereign AI Landing System
          </p>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            Governed Intelligence for Human Flourishing.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            Build AI systems that remember, reason, and execute under your governance—not the other way around.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#video"
              className="rounded-2xl bg-white px-6 py-3 font-semibold text-black"
            >
              Watch the Video
            </a>

            <a
              href="/downloads/sovereign-ai-constitution-template.pdf"
              target="_blank"
              className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Download the Constitution
            </a>

            <a
              href="#newsletter"
              className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Join the Newsletter
            </a>
          </div>
        </div>
      </section>

      <section id="video" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="aspect-video overflow-hidden rounded-[1.5rem] bg-black">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/qa4f-8IqpfQ"
              title="Sovereign AI: The Future of Governed Intelligence"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="max-w-4xl text-3xl font-bold md:text-5xl">
            Most AI systems are becoming powerful without becoming governed.
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <div
                key={problem}
                className="rounded-3xl border border-white/10 bg-black/30 p-6 text-white/75"
              >
                {problem}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="framework" className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
          The Framework
        </p>

        <h2 className="text-4xl font-bold md:text-5xl">
          Capture → Memory → Execution
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {framework.map((item, index) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-7"
            >
              <span className="text-white/35">0{index + 1}</span>
              <h3 className="mt-3 text-2xl font-bold">{item.title}</h3>
              <p className="mt-4 leading-7 text-white/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
          Who It&apos;s For
        </p>

        <h2 className="text-4xl font-bold md:text-5xl">Built for</h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Creators scaling content with AI",
            "Ministries managing teaching, outreach, and knowledge",
            "Founders building AI-native businesses",
            "Teams replacing scattered AI tools with governed systems",
            "Organisations requiring auditability and human oversight",
          ].map((audience) => (
            <div
              key={audience}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/75"
            >
              {audience}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
            Proof
          </p>

          <h2 className="text-4xl font-bold md:text-5xl">
            Built on a production-ready foundation
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              "19 production modules",
              "378 automated tests",
              "Governance-first architecture",
              "Human approval workflows",
              "Persistent memory",
              "Intelligent execution engine",
            ].map((stat) => (
              <div
                key={stat}
                className="rounded-3xl border border-white/10 bg-black/30 p-6 text-white/75"
              >
                {stat}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
              Lead Magnet
            </p>

            <h2 className="text-4xl font-bold md:text-5xl">
              Download the Sovereign AI Constitution Template.
            </h2>

            <p className="mt-5 leading-8 text-white/70">
              Start governing your AI before it governs your business. Define trusted sources, approval boundaries, memory rules, and execution policies with a practical framework you can adapt to your organisation.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-8 text-black">
            <h3 className="text-3xl font-bold">
              Sovereign AI Constitution Template
            </h3>

            <p className="mt-4 text-black/70">
              Use this to define what your AI is allowed to do, what requires
              human approval, what sources are trusted, and how your system
              protects people, mission, and truth.
            </p>

            <a
              href="/downloads/sovereign-ai-constitution-template.pdf"
              target="_blank"
              className="mt-6 inline-flex rounded-2xl bg-black px-6 py-3 font-semibold text-white"
            >
              Download PDF
            </a>
          </div>
        </div>
      </section>

      <section id="newsletter" className="mx-auto max-w-4xl px-6 py-24">
        <div className="rounded-[2rem] bg-white p-8 text-black md:p-10">
          <h2 className="text-3xl font-bold">
            Join the Sovereign Intelligence Network
          </h2>

          <p className="mt-3 text-black/70">
            Build AI your future self can trust.
            Join founders, creators, and organisations building governed intelligence instead of unmanaged automation.
          </p>

          <NewsletterForm />
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/45">
        © {new Date().getFullYear()} Echoes & Visions. Governed Intelligence for Human Flourishing.
      </footer>
    </main>
  )
}