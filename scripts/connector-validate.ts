#!/usr/bin/env node
/**
 * Connector Validator
 * npm run connector:validate -- --name=calendar
 *
 * Validates that a connector implements all required platform interfaces.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argMap: Record<string, string> = {};
for (const arg of args) {
  const [key, value] = arg.replace(/^--/, '').split('=');
  argMap[key] = value;
}

const connectorName = argMap['name'] ?? 'gmail';
const CONNECTOR_DIR = path.join(ROOT, 'lib', 'connectors', connectorName);

function exists(p: string) { return fs.existsSync(path.join(CONNECTOR_DIR, p)); }
function readFile(p: string) {
  const fp = path.join(CONNECTOR_DIR, p);
  return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
}

const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

const requiredFiles = ['oauth-adapter.ts', 'api-client.ts', 'resource-parser.ts', 'action-set.ts'];
for (const f of requiredFiles) {
  checks.push({ name: `File exists: ${f}`, pass: exists(f), detail: f });
}

const oauthContent = readFile('oauth-adapter.ts');
checks.push({ name: 'OAuth: authorizationUrl defined', pass: oauthContent.includes('authorizationUrl'), detail: 'oauth-adapter.ts' });
checks.push({ name: 'OAuth: tokenUrl defined', pass: oauthContent.includes('tokenUrl'), detail: 'oauth-adapter.ts' });
checks.push({ name: 'OAuth: requiredScopes defined', pass: oauthContent.includes('requiredScopes'), detail: 'oauth-adapter.ts' });
checks.push({ name: 'OAuth: validateToken defined', pass: oauthContent.includes('validateToken'), detail: 'oauth-adapter.ts' });
checks.push({ name: 'OAuth: token masking present', pass: oauthContent.includes('****'), detail: 'oauth-adapter.ts — tokens must be masked' });

const clientContent = readFile('api-client.ts');
checks.push({ name: 'Client: baseUrl defined', pass: clientContent.includes('baseUrl'), detail: 'api-client.ts' });
checks.push({ name: 'Client: rateLimitTiers defined', pass: clientContent.includes('rateLimitTiers'), detail: 'api-client.ts' });
checks.push({ name: 'Client: read() defined', pass: clientContent.includes('async read('), detail: 'api-client.ts' });

const actionContent = readFile('action-set.ts');
checks.push({ name: 'Actions: preview() defined', pass: actionContent.includes('async preview('), detail: 'action-set.ts' });
checks.push({ name: 'Actions: execute() defined', pass: actionContent.includes('async execute('), detail: 'action-set.ts' });
checks.push({ name: 'Safety: ENABLE_REAL_EXECUTION flag checked', pass: actionContent.includes('ENABLE_REAL_EXECUTION'), detail: 'action-set.ts — must check execution flag' });

const readerPath = path.join(ROOT, 'lib', 'gamma', `${connectorName}-reader.ts`);
const readerContent = fs.existsSync(readerPath) ? fs.readFileSync(readerPath, 'utf-8') : '';
checks.push({ name: 'GAMMA reader exists', pass: !!readerContent, detail: `lib/gamma/${connectorName}-reader.ts` });
checks.push({ name: 'Reader: extends GammaReaderBase', pass: readerContent.includes('GammaReaderBase'), detail: 'reader must extend GammaReaderBase' });
checks.push({ name: 'Reader: no Date.now()', pass: !readerContent.includes('Date.now()'), detail: 'determinism violation' });
checks.push({ name: 'Reader: no Math.random()', pass: !readerContent.includes('Math.random()'), detail: 'determinism violation' });

const testPath = path.join(ROOT, 'tests', 'connectors', `${connectorName}.test.ts`);
checks.push({ name: 'Test file exists', pass: fs.existsSync(testPath), detail: `tests/connectors/${connectorName}.test.ts` });

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';

console.log(`\n${'═'.repeat(55)}`);
console.log(`  CONNECTOR VALIDATOR: ${connectorName}`);
console.log('═'.repeat(55) + '\n');

let pass = 0, fail = 0;
for (const c of checks) {
  const icon = c.pass ? PASS : FAIL;
  console.log(`  ${icon} ${c.name}`);
  if (!c.pass) console.log(`     Issue: ${c.detail}`);
  if (c.pass) pass++; else fail++;
}

const score = Math.round((pass / checks.length) * 100);
console.log('\n' + '─'.repeat(55));
console.log(`  Connector Score: ${score}/100 (${pass}/${checks.length} checks)`);
if (fail === 0) console.log('  Status: VALID ✅');
else console.log(`  Status: INCOMPLETE — ${fail} issues`);
console.log('─'.repeat(55) + '\n');

process.exit(fail > 0 ? 1 : 0);
