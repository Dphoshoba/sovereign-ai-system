import Link from "next/link";

const docs = [
  {
    section: "Architecture",
    items: [
      {
        title: "Sovereign Architecture Blueprint",
        description: "Full architecture map of the Sovereign AI Operating System.",
        path: "/docs/architecture/SOVEREIGN_ARCHITECTURE_BLUEPRINT.md",
      },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        title: "Complete Operator Manual V3",
        description: "Main beginner-to-advanced operating manual.",
        path: "/docs/operations/SOVEREIGN_COMPLETE_OPERATOR_MANUAL_V3.md",
      },
      {
        title: "Daily Operations",
        description: "Daily checklist for operating Sovereign.",
        path: "https://github.com/Dphoshoba/sovereign-ai-system/blob/main/docs/operations/SOVEREIGN_DAILY_OPERATIONS.md",
      },
    ],
  },
  {
    section: "Inventory",
    items: [
      {
        title: "Feature Inventory",
        description: "Confirmed working, partial and planned capabilities.",
        path: "/docs/inventory/SOVEREIGN_FEATURE_INVENTORY.md",
      },
    ],
  },
  {
    section: "Roadmap",
    items: [
      {
        title: "Sovereign Roadmap 2026",
        description: "What exists, what is next and future build priorities.",
        path: "/docs/roadmap/SOVEREIGN_ROADMAP_2026.md",
      },
    ],
  },
  {
    section: "Audits",
    items: [
      {
        title: "System Audit June 2026",
        description: "Full audit of verified Sovereign systems.",
        path: "/docs/audits/SOVEREIGN_SYSTEM_AUDIT_JUNE_2026.md",
      },
      {
        title: "Production Readiness Assessment",
        description: "Subsystem readiness classifications.",
        path: "/docs/audits/SOVEREIGN_PRODUCTION_READINESS_ASSESSMENT.md",
      },
    ],
  },
  {
    section: "Deployment",
    items: [
      {
        title: "Deployment Checklist",
        description: "Deployment checklist.",
        path: "/docs/DEPLOYMENT_CHECKLIST.md",
      },
      {
        title: "Environment Setup",
        description: "Environment variable and setup notes.",
        path: "/docs/ENVIRONMENT_SETUP.md",
      },
      {
        title: "Production Launch Runbook",
        description: "Launch process and production runbook.",
        path: "/docs/PRODUCTION_LAUNCH_RUNBOOK.md",
      },
      {
        title: "Production Smoke Tests",
        description: "Production smoke testing checklist.",
        path: "/docs/PRODUCTION_SMOKE_TESTS.md",
      },
      {
        title: "Smoke Testing",
        description: "General smoke testing guide.",
        path: "/docs/SMOKE_TESTING.md",
      },
    ],
  },
];

export default function DocumentationHubPage() {
  return (
    <main className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Documentation Hub</h1>
        <p className="text-sm text-gray-500">
          Central operating knowledge base for the Sovereign AI system.
        </p>
      </div>

      <div className="grid gap-6">
        {docs.map((section) => (
          <section key={section.section} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.section}</h2>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <div
                  key={item.path}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <h3 className="font-semibold">{item.title}</h3>

                  <p className="text-sm text-gray-500">
                    {item.description}
                  </p>

                  <Link
                    href={item.path}
                    target="_blank"
                    className="inline-block text-sm underline"
                  >
                    Open document
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}