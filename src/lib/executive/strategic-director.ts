import { buildCfoIntelligence } from "./cfo-intelligence";
import { buildCooIntelligence } from "./coo-intelligence";
import { buildClientIntelligence } from "./client-intelligence";
import { buildRevenueIntelligence } from "./revenue-intelligence";

export async function buildStrategicDirector() {
  const [
    cfo,
    coo,
    clients,
    revenue,
  ] = await Promise.all([
    buildCfoIntelligence(),
    buildCooIntelligence(),
    buildClientIntelligence(),
    buildRevenueIntelligence(),
  ]);

  const companyHealth = Math.round(
    (
      cfo.financialHealth +
      coo.operationsHealth +
      revenue.revenueHealth
    ) / 3
  );

  const priorities: string[] = [];
  const risks: string[] = [];
  const directives: string[] = [];

  if (cfo.financialHealth < 70) {
    priorities.push("Improve cashflow");
    directives.push(
      "Collect outstanding invoices before pursuing aggressive expansion."
    );
  }

  if (coo.operationsHealth < 70) {
    priorities.push("Improve delivery execution");
    directives.push(
      "Resolve overdue projects and reduce delivery bottlenecks."
    );
  }

  if (revenue.revenueHealth < 70) {
    priorities.push("Grow predictable revenue");
    directives.push(
      "Increase recurring revenue and improve proposal conversion."
    );
  }

  if (companyHealth < 50) {
    risks.push("Overall company health is below target.");
  }

  if (
    cfo.financialHealth < 60 ||
    revenue.revenueHealth < 60
  ) {
    risks.push(
      "Cashflow and revenue growth require executive attention."
    );
  }

  if (coo.operationsHealth < 60) {
    risks.push(
      "Operational execution may delay strategic objectives."
    );
  }

  const next30Days = [
    "Collect outstanding invoices",
    "Resolve overdue projects",
    "Review top client accounts",
    "Execute high-priority automation actions",
  ];

  const next60Days = [
    "Increase recurring revenue",
    "Expand active client accounts",
    "Reduce operational bottlenecks",
    "Improve delivery capacity",
  ];

  const next90Days = [
    "Scale repeatable systems",
    "Increase company valuation drivers",
    "Strengthen client retention",
    "Expand executive automation coverage",
  ];

  return {
    companyHealth,
    priorities,
    risks,
    directives,
    next30Days,
    next60Days,
    next90Days,
    generatedAt: new Date().toISOString(),
  };
}