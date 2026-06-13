import { buildCfoIntelligence } from "./cfo-intelligence";
import { buildCooIntelligence } from "./coo-intelligence";
import { buildStrategicDirector } from "./strategic-director";

export async function buildExecutiveHealth() {
  const [cfo, coo, director] = await Promise.all([
    buildCfoIntelligence(),
    buildCooIntelligence(),
    buildStrategicDirector(),
  ]);

  const overallHealth = Math.round(
    (
      cfo.financialHealth +
      coo.operationsHealth +
      director.companyHealth
    ) / 3
  );

  let status = "Healthy";

  if (overallHealth < 80) status = "Stable";
  if (overallHealth < 60) status = "Warning";
  if (overallHealth < 40) status = "Critical";

  return {
    overallHealth,
    status,

    finance: cfo.financialHealth,
    operations: coo.operationsHealth,
    strategy: director.companyHealth,

    generatedAt: new Date().toISOString(),
  };
}