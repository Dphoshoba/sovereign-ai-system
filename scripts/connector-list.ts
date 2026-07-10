// scripts/connector-list.ts
// Phase XVII: List all connectors (definitions and generated)

import * as fs from "fs";
import * as path from "path";

interface ConnectorInfo {
  id: string;
  name: string;
  status: "defined" | "generated" | "deployed";
  resources: number;
  actions: number;
  version: string;
}

async function listConnectors(): Promise<void> {
  const basePath = process.cwd();
  const defsDir = path.join(basePath, "connectors/definitions");
  const generatedDir = path.join(basePath, "lib/connectors");
  const deployedDir = path.join(basePath, "app");

  const connectors: Map<string, ConnectorInfo> = new Map();

  // Load defined connectors
  if (fs.existsSync(defsDir)) {
    const files = fs.readdirSync(defsDir).filter(f => f.endsWith(".json"));
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(path.join(defsDir, file), "utf-8"));
      connectors.set(content.id, {
        id: content.id,
        name: content.name,
        status: "defined",
        resources: content.resources?.length || 0,
        actions: content.actions?.length || 0,
        version: content.version || "1.0.0",
      });
    }
  }

  // Check for generated connectors
  if (fs.existsSync(generatedDir)) {
    const dirs = fs.readdirSync(generatedDir);
    for (const dir of dirs) {
      const connector = connectors.get(dir);
      const connectorPath = path.join(generatedDir, dir);
      const isDir = fs.statSync(connectorPath).isDirectory();

      if (isDir && fs.existsSync(path.join(connectorPath, "index.ts"))) {
        if (connector) {
          connector.status = "generated";
        } else {
          connectors.set(dir, {
            id: dir,
            name: dir,
            status: "generated",
            resources: 0,
            actions: 0,
            version: "1.0.0",
          });
        }
      }
    }
  }

  // Check for deployed connectors (dashboard pages)
  if (fs.existsSync(deployedDir)) {
    const dirs = fs.readdirSync(deployedDir);
    for (const dir of dirs) {
      if (dir.endsWith("-connector")) {
        const id = dir.replace("-connector", "");
        const connector = connectors.get(id);
        if (connector) {
          connector.status = "deployed";
        }
      }
    }
  }

  // Display results
  console.log(`\n${"═".repeat(80)}`);
  console.log("GAMMA CONNECTOR REGISTRY");
  console.log(`${"═".repeat(80)}\n`);

  if (connectors.size === 0) {
    console.log("No connectors found.\n");
    console.log("To create a new connector definition:");
    console.log("  1. Create connectors/definitions/{name}.json");
    console.log("  2. Run: npm run connector:generate -- --definition=connectors/definitions/{name}.json\n");
    return;
  }

  // Group by status
  const byStatus = {
    deployed: Array.from(connectors.values()).filter(c => c.status === "deployed"),
    generated: Array.from(connectors.values()).filter(c => c.status === "generated"),
    defined: Array.from(connectors.values()).filter(c => c.status === "defined"),
  };

  if (byStatus.deployed.length > 0) {
    console.log("🚀 DEPLOYED CONNECTORS (Production Ready)\n");
    displayConnectorTable(byStatus.deployed);
  }

  if (byStatus.generated.length > 0) {
    console.log("✅ GENERATED CONNECTORS (Ready for Implementation)\n");
    displayConnectorTable(byStatus.generated);
  }

  if (byStatus.defined.length > 0) {
    console.log("📝 DEFINED CONNECTORS (Ready to Generate)\n");
    displayConnectorTable(byStatus.defined);
  }

  // Summary
  console.log(`\n${"═".repeat(80)}`);
  console.log("SUMMARY");
  console.log(`${"═".repeat(80)}`);
  console.log(`Total connectors:    ${connectors.size}`);
  console.log(`Deployed:            ${byStatus.deployed.length}`);
  console.log(`Generated:           ${byStatus.generated.length}`);
  console.log(`Ready to generate:   ${byStatus.defined.length}`);
  console.log(`\nTotal resources:     ${Array.from(connectors.values()).reduce((sum, c) => sum + c.resources, 0)}`);
  console.log(`Total actions:       ${Array.from(connectors.values()).reduce((sum, c) => sum + c.actions, 0)}`);

  console.log(`\n${"═".repeat(80)}\n`);

  // Usage hints
  console.log("Quick commands:");
  if (byStatus.defined.length > 0) {
    console.log(
      `  npm run connector:generate -- --definition=connectors/definitions/${byStatus.defined[0].id}.json`
    );
  }
  console.log(`  npm run connector:generate-batch -- --definitions=connectors/definitions/`);
  console.log(`  npm run connector:list (refresh this view)\n`);
}

function displayConnectorTable(connectors: ConnectorInfo[]): void {
  // Header
  console.log(`${"ID".padEnd(20)} ${"Name".padEnd(25)} Resources  Actions  Version`);
  console.log("-".repeat(80));

  for (const connector of connectors.sort((a, b) => a.id.localeCompare(b.id))) {
    console.log(
      `${connector.id.padEnd(20)} ${connector.name.padEnd(25)} ${String(connector.resources).padEnd(9)} ${String(connector.actions).padEnd(8)} ${connector.version}`
    );
  }

  console.log("");
}

// Run
if (require.main === module) {
  listConnectors().catch(err => {
    console.error(`Error: ${err}`);
    process.exit(1);
  });
}
