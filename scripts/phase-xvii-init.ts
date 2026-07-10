// scripts/phase-xvii-init.ts
// Phase XVII: Autonomous Connector Generation Pipeline
// Initialize and validate the autonomous factory

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const log = (msg: string) => console.log(`[PHASE XVII] ${msg}`);
const success = (msg: string) => console.log(`✅ ${msg}`);
const error = (msg: string) => console.error(`❌ ${msg}`);
const section = (title: string) => console.log(`\n${"═".repeat(60)}\n${title}\n${"═".repeat(60)}\n`);

async function initPhaseXVII() {
  section("PHASE XVII: AUTONOMOUS CONNECTOR FACTORY");

  try {
    // Step 1: Verify Prerequisites
    log("Step 1/5: Verifying prerequisites...");
    verifyPrerequisites();
    success("All prerequisites verified");

    // Step 2: Initialize Directories
    log("Step 2/5: Setting up directories...");
    initializeDirectories();
    success("Directories initialized");

    // Step 3: Create Base Definitions
    log("Step 3/5: Loading connector definitions...");
    const definitions = loadConnectorDefinitions();
    log(`Found ${definitions.length} connector definitions ready for generation`);
    success(`Definitions loaded (${definitions.map(d => d.name).join(", ")})`);

    // Step 4: Validate Schema
    log("Step 4/5: Validating connector definitions...");
    validateDefinitions(definitions);
    success("All definitions valid");

    // Step 5: Display Status
    log("Step 5/5: Displaying Phase XVII status...");
    displayStatus(definitions);
    success("Phase XVII initialization complete");

    // Summary
    section("PHASE XVII READY");
    console.log(`✅ Autonomous Connector Factory is ready!

Usage:
  npm run connector:generate -- --definition=connectors/definitions/slack.json
  npm run connector:generate-batch -- --definitions=connectors/definitions/
  npm run connector:list

Next Steps:
  1. Generate your first connector:
     npm run connector:generate -- --definition=connectors/definitions/slack.json

  2. Verify the generated connector:
     npm test -- tests/connectors/slack.test.ts

  3. View the production-ready connector:
     cd app/slack-connector
     ls -la

Documentation:
  - docs/PHASE_XVII_SPECIFICATION.md
  - docs/CONNECTOR_DEFINITION_GUIDE.md
  - docs/PHASE_XVII_QUICK_REFERENCE.md
`);
  } catch (err) {
    error(`Initialization failed: ${err}`);
    process.exit(1);
  }
}

function verifyPrerequisites(): void {
  // Check Node.js version
  const nodeVersion = execSync("node --version", { encoding: "utf-8" }).trim();
  if (!nodeVersion.includes("v")) {
    throw new Error(`Invalid Node.js version: ${nodeVersion}`);
  }

  // Check npm
  const npmVersion = execSync("npm --version", { encoding: "utf-8" }).trim();

  // Check TypeScript
  const tsVersion = execSync("npx tsc --version", { encoding: "utf-8" }).trim();

  // Check essential directories
  const requiredDirs = [
    "scripts",
    "lib/connectors",
    "app",
    "tests/connectors",
    "docs/connectors",
    ".github/workflows",
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(path.join(process.cwd(), dir))) {
      throw new Error(`Missing required directory: ${dir}`);
    }
  }

  log(`  Node.js: ${nodeVersion}`);
  log(`  npm: ${npmVersion}`);
  log(`  TypeScript: ${tsVersion}`);
}

function initializeDirectories(): void {
  const dirs = [
    "connectors/definitions",
    "connectors/generated",
    "lib/connectors",
    "tests/connectors",
    "tests/fixtures",
    "docs/connectors",
    ".github/workflows",
  ];

  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`  Created: ${dir}`);
    }
  }
}

interface DefinitionFile {
  name: string;
  path: string;
  id: string;
  resources: number;
  actions: number;
}

function loadConnectorDefinitions(): DefinitionFile[] {
  const defsDir = path.join(process.cwd(), "connectors/definitions");

  if (!fs.existsSync(defsDir)) {
    return [];
  }

  const files = fs.readdirSync(defsDir).filter(f => f.endsWith(".json"));

  return files.map(file => {
    const filePath = path.join(defsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    return {
      name: content.name,
      path: filePath,
      id: content.id,
      resources: content.resources?.length || 0,
      actions: content.actions?.length || 0,
    };
  });
}

function validateDefinitions(definitions: DefinitionFile[]): void {
  for (const def of definitions) {
    if (!def.id || !def.name) {
      throw new Error(`Invalid definition: ${def.path} missing id or name`);
    }
    if (def.resources === 0) {
      throw new Error(`Invalid definition: ${def.name} has no resources`);
    }
    if (def.actions === 0) {
      throw new Error(`Invalid definition: ${def.name} has no actions`);
    }
    log(`  ✓ ${def.name} (${def.resources} resources, ${def.actions} actions)`);
  }
}

function displayStatus(definitions: DefinitionFile[]): void {
  console.log("\n📊 STATUS:\n");
  console.log(`Definitions Ready: ${definitions.length}`);
  console.log(`Total Resources: ${definitions.reduce((sum, d) => sum + d.resources, 0)}`);
  console.log(`Total Actions: ${definitions.reduce((sum, d) => sum + d.actions, 0)}`);
  console.log(`\nConnectors Ready to Generate:`);
  for (const def of definitions) {
    console.log(`  • ${def.name} (${def.id})`);
  }
}

// Run initialization
if (require.main === module) {
  initPhaseXVII().catch(err => {
    error(`Fatal error: ${err}`);
    process.exit(1);
  });
}
