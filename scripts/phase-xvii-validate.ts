// scripts/phase-xvii-validate.ts
// Phase XVII: Direct Connector Validation (bypasses autonomous generator execution)
// Validates a generated connector without running full pipeline

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ValidationResult {
  stage: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

const results: ValidationResult[] = [];

function log(msg: string) {
  console.log(`[VALIDATE] ${msg}`);
}

function pass(stage: string, message: string, details?: Record<string, any>) {
  results.push({ stage, passed: true, message, details });
  console.log(`✅ ${stage}: ${message}`);
}

function fail(stage: string, message: string, details?: Record<string, any>) {
  results.push({ stage, passed: false, message, details });
  console.error(`❌ ${stage}: ${message}`);
}

async function validateSlackConnector() {
  const basePath = process.cwd();
  const connectorId = "slack";

  console.log(`\n${"═".repeat(70)}`);
  console.log("PHASE XVII: SLACK CONNECTOR VALIDATION");
  console.log(`${"═".repeat(70)}\n`);

  const validationStartTime = Date.now();

  // Stage 1: Check core files exist
  log("Stage 1/10: Checking artifact files exist...");
  const requiredFiles = [
    `lib/connectors/${connectorId}/oauth-adapter.ts`,
    `lib/connectors/${connectorId}/api-client.ts`,
    `lib/connectors/${connectorId}/resource-parser.ts`,
    `lib/connectors/${connectorId}/action-set.ts`,
    `lib/connectors/${connectorId}/index.ts`,
    `lib/connectors/${connectorId}/metadata.ts`,
    `lib/gamma/${connectorId}-reader.ts`,
    `app/${connectorId}-connector/page.tsx`,
    `app/api/connectors/${connectorId}/status/route.ts`,
    `tests/connectors/${connectorId}.test.ts`,
    `tests/fixtures/${connectorId}/${connectorId}-fixtures.ts`,
    `docs/connectors/${connectorId}.md`,
    `docs/connectors/${connectorId}-architecture.md`,
    `docs/connectors/${connectorId}-operations.md`,
    `docs/connectors/${connectorId}-openapi.yaml`,
    `.github/workflows/${connectorId}-validate.yml`,
  ];

  const filesGenerated = [];
  const filesMissing = [];

  for (const file of requiredFiles) {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
      filesGenerated.push(file);
    } else {
      filesMissing.push(file);
    }
  }

  if (filesMissing.length === 0) {
    pass("Files Generated", `All ${filesGenerated.length} required files exist`, {
      generated: filesGenerated.length,
      missing: 0,
    });
  } else {
    fail("Files Generated", `${filesMissing.length} files missing`, {
      missing: filesMissing,
    });
  }

  // Stage 2: Check for Gmail references
  log("\nStage 2/10: Scanning for Gmail-specific references...");
  const gmailPatterns = ["gmail", "Gmail", "GMAIL", "GoogleMail"];
  const gmailReferences = [];

  for (const file of filesGenerated) {
    const filePath = path.join(basePath, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of gmailPatterns) {
        if (content.includes(pattern) && !file.includes("tests")) {
          gmailReferences.push({ file, pattern });
        }
      }
    } catch (err) {
      // Ignore read errors
    }
  }

  if (gmailReferences.length === 0) {
    pass("Gmail Scan", "Zero Gmail-specific references found");
  } else {
    fail("Gmail Scan", `Found ${gmailReferences.length} Gmail references`, {
      references: gmailReferences,
    });
  }

  // Stage 3: Build
  log("\nStage 3/10: Running npm build...");
  const buildStart = Date.now();
  try {
    execSync("npm run build", { cwd: basePath, stdio: "pipe" });
    const buildTime = Date.now() - buildStart;
    pass("Build", `Compiled successfully in ${(buildTime / 1000).toFixed(1)}s`, {
      duration: buildTime,
    });
  } catch (err) {
    fail("Build", `Build failed: ${String(err).split("\n")[0]}`);
    return results;
  }

  // Stage 4: Run Slack tests
  log("\nStage 4/10: Running Slack connector tests...");
  const testStart = Date.now();
  try {
    const output = execSync(`npx vitest run tests/connectors/${connectorId}.test.ts`, {
      cwd: basePath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    const testTime = Date.now() - testStart;

    const passMatch = output.match(/(\d+) passed/);
    const passCount = passMatch ? parseInt(passMatch[1]) : 0;

    if (passCount > 0) {
      pass("Slack Tests", `${passCount} tests passing (${(testTime / 1000).toFixed(2)}s)`, {
        passed: passCount,
        duration: testTime,
      });
    } else {
      fail("Slack Tests", "No tests found or tests failed");
    }
  } catch (err) {
    fail("Slack Tests", `Test execution failed: ${String(err).split("\n")[0]}`);
  }

  // Stage 5: Full test suite
  log("\nStage 5/10: Running full test suite...");
  try {
    const output = execSync("npm test", { cwd: basePath, encoding: "utf-8", stdio: "pipe" });
    const fileMatch = output.match(/(\d+) passed/);
    const testMatch = output.match(/Tests\s+(\d+) passed/);

    const filesPassed = fileMatch ? parseInt(fileMatch[1]) : 0;
    const testsPassed = testMatch ? parseInt(testMatch[1]) : 0;

    pass("Full Suite", `${filesPassed} file(s), ${testsPassed} total tests passing`, {
      files: filesPassed,
      tests: testsPassed,
    });
  } catch (err) {
    fail("Full Suite", `Suite failed: ${String(err).split("\n")[0]}`);
  }

  // Stage 6: Determinism check
  log("\nStage 6/10: Verifying determinism...");
  try {
    // Run tests twice and compare outputs
    const run1 = execSync(`npx vitest run tests/connectors/${connectorId}.test.ts`, {
      cwd: basePath,
      encoding: "utf-8",
      stdio: "pipe",
    });
    const run2 = execSync(`npx vitest run tests/connectors/${connectorId}.test.ts`, {
      cwd: basePath,
      encoding: "utf-8",
      stdio: "pipe",
    });

    if (run1.includes("passed") && run2.includes("passed")) {
      pass("Determinism", "Tests pass consistently across multiple runs");
    } else {
      fail("Determinism", "Tests produced different results across runs");
    }
  } catch (err) {
    fail("Determinism", `Check failed: ${String(err).split("\n")[0]}`);
  }

  // Stage 7: Code quality checks
  log("\nStage 7/10: Checking code quality...");
  try {
    const slackFiles = filesGenerated.filter(f => f.includes(connectorId));
    let violations = 0;

    for (const file of slackFiles) {
      if (file.includes("test") || file.includes("fixture")) continue;
      const filePath = path.join(basePath, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Check for problematic patterns
      if (content.includes("Date.now()") && file.includes("reader")) violations++;
      if (content.includes("Math.random()")) violations++;
      if (content.match(/secret|password|token/gi)) violations++;
    }

    if (violations === 0) {
      pass("Code Quality", "No violations found");
    } else {
      fail("Code Quality", `${violations} code quality violations found`);
    }
  } catch (err) {
    fail("Code Quality", `Check failed: ${String(err).split("\n")[0]}`);
  }

  // Stage 8: Route validation
  log("\nStage 8/10: Checking API routes...");
  try {
    const routePath = path.join(basePath, `app/api/connectors/${connectorId}/status/route.ts`);
    const content = fs.readFileSync(routePath, "utf-8");

    if (content.includes("export async function GET")) {
      pass("Routes", "API route exported correctly");
    } else {
      fail("Routes", "API route not properly exported");
    }
  } catch (err) {
    fail("Routes", `Route check failed: ${String(err)}`);
  }

  // Stage 9: Registration check
  log("\nStage 9/10: Checking connector registration...");
  try {
    const regPath = path.join(basePath, `lib/connectors/${connectorId}/metadata.ts`);
    const content = fs.readFileSync(regPath, "utf-8");

    if (content.includes("ConnectorMetadata") || content.includes(`'${connectorId}'`)) {
      pass("Registration", "Connector metadata configured");
    } else {
      fail("Registration", "Metadata not found");
    }
  } catch (err) {
    fail("Registration", `Registration check failed: ${String(err)}`);
  }

  // Stage 10: Summary
  log("\nStage 10/10: Generating validation summary...");
  const allPassed = results.every(r => r.passed);
  const duration = Date.now() - validationStartTime;

  console.log(`\n${"═".repeat(70)}`);
  console.log("VALIDATION SUMMARY");
  console.log(`${"═".repeat(70)}`);

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  console.log(`\nResults: ${passCount}/${results.length} stages passed`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Status: ${allPassed ? "✅ READY FOR PRODUCTION" : "❌ NEEDS FIXES"}\n`);

  // Display detailed results
  console.log("Detailed Results:");
  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.stage}: ${result.message}`);
  }

  console.log(`\n${"═".repeat(70)}`);

  return results;
}

// Run validation
async function main() {
  try {
    await validateSlackConnector();
    process.exit(0);
  } catch (err) {
    console.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { validateSlackConnector };
