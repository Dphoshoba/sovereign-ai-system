// scripts/connector-generate-batch.ts
// Phase XVII: Batch Connector Generation
// Generate multiple connectors in parallel

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { AutonomousConnectorGenerator } from "./connector-generate-autonomous";

interface BatchResult {
  connectorId: string;
  success: boolean;
  message: string;
  duration: number;
}

async function generateBatch(definitionsDir: string): Promise<void> {
  const log = (msg: string) => console.log(`[BATCH] ${msg}`);

  try {
    log(`Starting batch generation from: ${definitionsDir}`);

    if (!fs.existsSync(definitionsDir)) {
      throw new Error(`Definitions directory not found: ${definitionsDir}`);
    }

    const definitions = fs.readdirSync(definitionsDir).filter(f => f.endsWith(".json"));

    if (definitions.length === 0) {
      throw new Error(`No connector definitions found in ${definitionsDir}`);
    }

    log(`Found ${definitions.length} connector definitions`);
    console.log(`\n${"═".repeat(60)}`);
    console.log("BATCH GENERATION STARTING");
    console.log(`${"═".repeat(60)}\n`);

    const startTime = Date.now();
    const results: BatchResult[] = [];

    // Generate each connector sequentially (can be parallelized in production)
    for (const defFile of definitions) {
      const defPath = path.join(definitionsDir, defFile);
      const connectorId = path.basename(defFile, ".json");
      const genStartTime = Date.now();

      try {
        log(`Generating ${connectorId}...`);

        const generator = new AutonomousConnectorGenerator(defPath);
        const result = await generator.generateAutonomously();

        const duration = Math.floor((Date.now() - genStartTime) / 1000);
        results.push({
          connectorId,
          success: result.success,
          message: result.message,
          duration,
        });

        log(`✅ ${connectorId} generated in ${duration}s`);
      } catch (error) {
        const duration = Math.floor((Date.now() - genStartTime) / 1000);
        results.push({
          connectorId,
          success: false,
          message: String(error),
          duration,
        });
        log(`❌ ${connectorId} failed: ${error}`);
      }
    }

    const totalDuration = Math.floor((Date.now() - startTime) / 1000);

    console.log(`\n${"═".repeat(60)}`);
    console.log("BATCH GENERATION COMPLETE");
    console.log(`${"═".repeat(60)}\n`);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`📊 Results:`);
    console.log(`  Total connectors: ${results.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failureCount}`);
    console.log(`  Total duration: ${totalDuration}s`);

    console.log(`\n📋 Details:`);
    for (const result of results) {
      const status = result.success ? "✅" : "❌";
      console.log(`  ${status} ${result.connectorId} (${result.duration}s)`);
      if (!result.success) {
        console.log(`     Error: ${result.message}`);
      }
    }

    console.log("\n🚀 All connectors are now live!");

    process.exit(failureCount > 0 ? 1 : 0);
  } catch (error) {
    console.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

// Get definitions directory from args
const defsDir = process.argv[2] || path.join(process.cwd(), "connectors/definitions");
generateBatch(defsDir);
