import type { Metadata } from "next"
import Link from "next/link"
import NewsletterForm from "@/components/public/NewsletterForm"

export const metadata: Metadata = {
  title: "Echoes & Visions Sovereign Intelligence Platform",
  description:
    "A governed AI ecosystem for creators, ministries, founders, and organizations.",
}

const pillars = [
  ["AI Sovereign Systems", "Prompt engines, agents, workflows, dashboards, reasoning systems, and governed automation."],
  ["Creator Intelligence", "YouTube, content, offers, CRM, email, and automation working as one creator operating system."],
  ["Ministry Intelligence", "Bible-centered AI tools, discipleship systems, teaching workflows, and wisdom infrastructure."],
  ["Strategic Foresight", "World modeling, reasoning engines, semantic memory, and governance for better decisions."],
]

const products = [
  "Architect.io Quantum",
  "Veritas Bible Intelligence",
  "Creator Automation OS",
  "Sovereign Executive Runtime",
  "Knowledge Graph + Semantic Memory",
  "Ministry AI Infrastructure",
]

export default function EchoesAndVisionsAIPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold">
            Echoes & Visions
          </Link>

          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#ecosystem">Ecosystem</a>
            <a href="#youtube">YouTube</a>
            <a href="#products">Products</a>
            <a href="#newsletter">Newsletter</a>
          </div>

          <a
            href="#newsletter"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Join
          </a>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70">
            Sovereign Intelligence Platform
          </p>

          <h1 className="max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">
            Build governed AI systems for creators, ministries, founders, and organizations.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            Echoes & Visions turns scattered AI tools into one intelligent ecosystem:
            memory, governance, automation, strategy, content, and execution working together.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#youtube"
              className="rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
            >
              Watch on YouTube
            </a>

            <a
              href="#newsletter"
              className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Join the Newsletter
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            Operating Flywheel
          </p>

          <div className="mt-6 space-y-3">
            {["YouTube", "Email List", "Community", "Products", "Platform"].map(
              (item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5"
                >
                  <span className="text-white/40">0{index + 1}</span>
                  <h3 className="mt-1 text-xl font-semibold">{item}</h3>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-bold md:text-5xl">
            One ecosystem. Four pillars.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-black/30 p-6"
              >
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="youtube" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/40">
              Dominant Channel
            </p>

            <h2 className="text-4xl font-bold md:text-5xl">
              YouTube becomes the main trust engine.
            </h2>

            <p className="mt-5 leading-8 text-white/70">
              The goal is not random posting. The goal is consistent, useful,
              faith-rooted, AI-powered content that compounds trust every week.
            </p>

            <ul className="mt-6 space-y-3 text-white/75">
              <li>• 1 excellent Short per day</li>
              <li>• 2 long-form videos per week</li>
              <li>• 1 weekly email newsletter</li>
              <li>• 1 monthly flagship resource or offer</li>
            </ul>
          </div>

          <div className="aspect-video rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex h-full items-center justify-center rounded-[1.5rem] bg-black/60 text-center">
              <div>
                <p className="text-2xl font-bold">YouTube Video Embed</p>
                <p className="mt-2 text-white/50">
                  Replace this box later with your channel trailer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-bold md:text-5xl">
            The flagship product ecosystem.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product}
                className="rounded-3xl border border-white/10 bg-black/30 p-6"
              >
                <h3 className="text-xl font-semibold">{product}</h3>
                <p className="mt-3 text-white/60">
                  Part of the Echoes & Visions sovereign intelligence stack.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-4xl font-bold">Lead Magnet</h2>
              <p className="mt-4 leading-8 text-white/70">
                Offer a practical downloadable guide that helps creators and ministries
                understand how to build governed AI systems without chaos.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-black">
              <h3 className="text-2xl font-bold">
                Free Guide: The Sovereign AI Creator Blueprint
              </h3>
              <p className="mt-3 text-black/70">
                Learn the simple operating model: YouTube → Email → Community →
                Products → Platform.
              </p>
              <a
                href="/downloads/sovereign-ai-constitution-template.pdf"
                target="_blank"
                className="mt-6 inline-flex rounded-2xl bg-black px-6 py-3 font-semibold text-white"
              >
                Download the Constitution Template
             </a>
            </div>
          </div>
        </div>
      </section>

      <section id="newsletter" className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-[2rem] bg-white p-8 text-black md:p-10">
          <h2 className="text-3xl font-bold">
            Join the Sovereign Intelligence Newsletter
          </h2>

          <p className="mt-3 text-black/70">
            Get practical AI systems, creator strategy, ministry intelligence,
            and executive operating frameworks.
          </p>

          <NewsletterForm />

          <p className="mt-4 text-sm text-black/50">
            Next step: connect this form to Resend, Supabase, ConvertKit, Beehiiv, or your CRM.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-white/45">
        © {new Date().getFullYear()} Echoes & Visions. Governed intelligence for human flourishing.
      </footer>
    </main>
  )
}