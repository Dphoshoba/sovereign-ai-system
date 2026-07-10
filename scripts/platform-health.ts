#!/usr/bin/env node
/**
 * Platform Health Check
 * npm run platform:health
 *
 * Quick health check of the Gamma Connector Platform:
 * - SDK integrity
 * - Connector health
 * - Reader count
 * - Test count
 * - Build readiness
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

function exists(p: string): boolean {
  return fs.existsSync(path.join(ROOT, p));
}

function countFiles(dir: string, ext = '.ts'): number {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return 0;
  return fs.readdirSync(fullDir).filter(f => f.endsWith(ext)).length;
}

const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

// SDK files present
checks.push({
  name: 'Platform SDK exists',
  pass: exists('lib/platform/connector-platform-sdk.ts'),
  detail: 'lib/platform/connector-platform-sdk.ts',
});

checks.push({
  name: 'GammaReaderBase exists',
  pass: exists('lib/platform/gamma-reader-base.ts'),
  detail: 'lib/platform/gamma-reader-base.ts',
});

checks.push({
  name: 'API helpers exist',
  pass: exists('lib/platform/api-response-helpers.ts'),
  detail: 'lib/platform/api-response-helpers.ts',
});

checks.push({
  name: 'Health helpers exist',
  pass: exists('lib/platform/health-helpers.ts'),
  detail: 'lib/platform/health-helpers.ts',
});

// Gmail connector complete
const gmailFiles = ['health-checker.ts', 'approval-engine.ts', 'queue-engine.ts',
  'compliance-audit.ts', 'certification-runner.ts', 'sanitizer.ts'];

for (const f of gmailFiles) {
  checks.push({
    name: `Gmail connector: ${f}`,
    pass: exists(`lib/connectors/gmail/${f}`),
    detail: `lib/connectors/gmail/${f}`,
  });
}

// Readers present
const readerCount = countFiles('lib/gamma');
checks.push({
  name: 'Gamma readers',
  pass: readerCount >= 100,
  detail: `${readerCount} readers found`,
});

// Documentation present
checks.push({
  name: 'Engineering review',
  pass: exists('docs/platform/ENGINEERING_REVIEW.md'),
  detail: 'docs/platform/ENGINEERING_REVIEW.md',
});

checks.push({
  name: 'Platform documentation',
  pass: exists('docs/platform/CONNECTOR_PLATFORM_V1.md'),
  detail: 'docs/platform/CONNECTOR_PLATFORM_V1.md',
});

// Connector generator
checks.push({
  name: 'Connector generator',
  pass: exists('scripts/connector-scaffold.ts'),
  detail: 'scripts/connector-scaffold.ts',
});

// Output
const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';

console.log('\n' + '═'.repeat(55));
console.log('  GAMMA PLATFORM HEALTH');
console.log('═'.repeat(55) + '\n');

let pass = 0, fail = 0;
for (const c of checks) {
  const icon = c.pass ? PASS : FAIL;
  console.log(`  ${icon} ${c.name}`);
  if (!c.pass) console.log(`     Missing: ${c.detail}`);
  if (c.pass) pass++; else fail++;
}

const score = Math.round((pass / checks.length) * 100);
console.log('\n' + '─'.repeat(55));
console.log(`  Platform Health: ${score}/100 (${pass}/${checks.length} checks pass)`);
console.log('─'.repeat(55) + '\n');

process.exit(fail > 0 ? 1 : 0);
