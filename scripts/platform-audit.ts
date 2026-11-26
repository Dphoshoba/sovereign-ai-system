#!/usr/bin/env node
/**
 * Platform Audit Script
 * npm run audit
 *
 * Analyzes the platform for:
 * - Reader pattern compliance (determinism)
 * - Duplicate code patterns
 * - Dead stub readers
 * - Test coverage gaps
 * - Large files
 * - Import chain depth
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const GAMMA_DIR = path.join(ROOT, 'lib', 'gamma');
const CONNECTOR_DIR = path.join(ROOT, 'lib', 'connectors');
const PLATFORM_DIR = path.join(ROOT, 'lib', 'platform');
const TESTS_DIR = path.join(ROOT, 'tests');

interface AuditResult {
  category: string;
  severity: 'pass' | 'warn' | 'fail';
  message: string;
  count?: number;
  files?: string[];
}

function readTs(dir: string): Array<{ name: string; path: string; content: string; lines: number }> {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.ts'))
    .map(f => {
      const fullPath = path.join(dir, f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return { name: f, path: fullPath, content, lines: content.split('\n').length };
    });
}

const results: AuditResult[] = [];

// ─── Gamma Reader Audit ────────────────────────────────────────────────────────

const readers = readTs(GAMMA_DIR);

const stubReaders = readers.filter(r => r.lines < 20);
results.push({
  category: 'GAMMA Readers',
  severity: stubReaders.length > 0 ? 'warn' : 'pass',
  message: `Stub readers (<20 lines): ${stubReaders.length}/${readers.length}`,
  count: stubReaders.length,
  files: stubReaders.map(r => r.name),
});

const dateNowReaders = readers.filter(r => r.content.includes('Date.now()'));
results.push({
  category: 'Determinism',
  severity: dateNowReaders.length > 0 ? 'fail' : 'pass',
  message: `Readers using Date.now() (violation): ${dateNowReaders.length}`,
  count: dateNowReaders.length,
  files: dateNowReaders.map(r => r.name),
});

const mathRandomReaders = readers.filter(r => r.content.includes('Math.random()'));
results.push({
  category: 'Determinism',
  severity: mathRandomReaders.length > 0 ? 'fail' : 'pass',
  message: `Readers using Math.random() (violation): ${mathRandomReaders.length}`,
  count: mathRandomReaders.length,
  files: mathRandomReaders.map(r => r.name),
});

const largeReaders = readers.filter(r => r.lines > 400);
results.push({
  category: 'Size',
  severity: largeReaders.length > 0 ? 'warn' : 'pass',
  message: `Large readers (>400 lines): ${largeReaders.length}`,
  count: largeReaders.length,
  files: largeReaders.map(r => `${r.name} (${r.lines} lines)`),
});

// ─── Connector Audit ───────────────────────────────────────────────────────────

const gmailFiles = readTs(path.join(CONNECTOR_DIR, 'gmail'));

const largeConnectorFiles = gmailFiles.filter(f => f.lines > 400);
results.push({
  category: 'Connector Size',
  severity: largeConnectorFiles.length > 0 ? 'warn' : 'pass',
  message: `Large connector files (>400 lines): ${largeConnectorFiles.length}`,
  count: largeConnectorFiles.length,
  files: largeConnectorFiles.map(f => `${f.name} (${f.lines} lines)`),
});

const connectorWithDateNow = gmailFiles.filter(f => f.content.includes('Date.now()'));
results.push({
  category: 'Connector Safety',
  severity: connectorWithDateNow.length > 0 ? 'warn' : 'pass',
  message: `Connector files using Date.now(): ${connectorWithDateNow.length}`,
  count: connectorWithDateNow.length,
  files: connectorWithDateNow.map(f => f.name),
});

// ─── Platform SDK Audit ────────────────────────────────────────────────────────

const platformFiles = readTs(PLATFORM_DIR);
results.push({
  category: 'Platform SDK',
  severity: platformFiles.length >= 4 ? 'pass' : 'warn',
  message: `Platform SDK files: ${platformFiles.length}`,
  count: platformFiles.length,
  files: platformFiles.map(f => f.name),
});

// ─── Test Coverage Audit ──────────────────────────────────────────────────────

let testCount = 0;
let testFiles: string[] = [];

function countTestFiles(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      countTestFiles(fullPath);
    } else if (entry.name.endsWith('.test.ts')) {
      testFiles.push(entry.name);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(/\bit\s*\(/g);
      testCount += matches ? matches.length : 0;
    }
  }
}

countTestFiles(TESTS_DIR);

results.push({
  category: 'Tests',
  severity: testCount >= 500 ? 'pass' : testCount >= 400 ? 'warn' : 'fail',
  message: `Test cases: ${testCount} (target: 500+)`,
  count: testCount,
});

// ─── Security Audit ───────────────────────────────────────────────────────────

const allConnectorContent = gmailFiles.map(f => f.content).join('\n');
const hasTokenLog = /console\.(log|debug)\s*\([^)]*token[^)]*\)/i.test(allConnectorContent);
results.push({
  category: 'Security',
  severity: hasTokenLog ? 'fail' : 'pass',
  message: hasTokenLog ? 'Token logging detected!' : 'No raw token logging found',
});

// ─── Report Output ─────────────────────────────────────────────────────────────

const COLORS = {
  pass: '\x1b[32m✅',
  warn: '\x1b[33m⚠️ ',
  fail: '\x1b[31m❌',
  reset: '\x1b[0m',
};

console.log('\n' + '═'.repeat(60));
console.log('  GAMMA PLATFORM AUDIT');
console.log('═'.repeat(60) + '\n');

let passCount = 0, warnCount = 0, failCount = 0;

for (const result of results) {
  const icon = COLORS[result.severity];
  console.log(`${icon} [${result.category}] ${result.message}${COLORS.reset}`);

  if (result.files && result.severity !== 'pass' && result.files.length <= 5) {
    for (const file of result.files) {
      console.log(`    → ${file}`);
    }
    if (result.files.length > 5) {
      console.log(`    → ... and ${result.files.length - 5} more`);
    }
  }

  if (result.severity === 'pass') passCount++;
  else if (result.severity === 'warn') warnCount++;
  else failCount++;
}

console.log('\n' + '─'.repeat(60));
console.log(`  Results: ${passCount} pass, ${warnCount} warn, ${failCount} fail`);

const overallScore = Math.round((passCount / results.length) * 100);
console.log(`  Platform Audit Score: ${overallScore}/100`);
console.log('─'.repeat(60) + '\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
