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

  return {
    companyHealth: Math.round(
      (
        cfo.financialHealth +
        coo.operationsHealth +
        revenue.revenueHealth
      ) / 3
    ),

    priorities: [],

    risks: [],

    directives: [],

    next30Days: [],

    next60Days: [],

    next90Days: [],

    generatedAt: new Date().toISOString(),
  };
}