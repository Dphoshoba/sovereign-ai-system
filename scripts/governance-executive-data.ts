import { readFileSync } from 'fs';
import { globSync } from 'glob';
import { resolve } from 'path';

const GOVERNED_MODELS = [
  'CreatorLead',
  'ClientProfile',
  'CreatorProposal',
  'ClientProject',
  'ClientProjectTask',
  'ClientInvoice',
] as const;

type GovernedModel = (typeof GOVERNED_MODELS)[number];

const EXCLUDED_DIRS = ['tests', 'scripts', 'prisma', 'node_modules'];

interface Violation {
  file: string;
  line: number;
  model: GovernedModel;
  suggestedFix: string;
}

// Regex to find Prisma model queries: prisma.<camelCaseModel>.<method>(...)
function buildQueryPattern(model: string): RegExp {
  const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
  return new RegExp(`prisma\\.${camelModel}\\.(findMany|findUnique|findFirst|create|update|upsert|delete)\\s*\\(`, 'g');
}

// Regex to check if where clause contains isTest: false
function hasTestFilter(content: string, matchIndex: number): boolean {
  // Look ahead from the match for the where/isTest pattern
  const lookAhead = content.slice(matchIndex, matchIndex + 500);
  return /where\s*:\s*{[^}]*isTest\s*:\s*false/m.test(lookAhead);
}

// Check for the exclusion comment on the same line or previous line
function hasExclusion(content: string, lineIndex: number): boolean {
  const lines = content.split('\n');
  // Check current line and one line before
  for (let i = Math.max(0, lineIndex - 1); i <= Math.min(lineIndex, lines.length - 1); i++) {
    if (/executive-governance-ignore/.test(lines[i])) {
      return true;
    }
  }
  return false;
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function analyzeFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, 'utf-8');
  const violations: Violation[] = [];

  for (const model of GOVERNED_MODELS) {
    const pattern = buildQueryPattern(model);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const lineNum = getLineNumber(content, match.index);

      if (hasExclusion(content, lineNum - 1)) {
        continue;
      }

      if (!isTestFiltered(content, match.index)) {
        violations.push({
          file: filePath,
          line: lineNum,
          model: model as GovernedModel,
          suggestedFix: `where: { isTest: false }`,
        });
      }
    }
  }

  return violations;
}

function isTestFiltered(content: string, matchIndex: number): boolean {
  // Look ahead for isTest: false in a where clause or as a property
  const ahead = content.slice(matchIndex, matchIndex + 600);

  // Check for isTest: false inside where clause anywhere in the lookahead
  // This handles both { where: { isTest: false } } and { where: { ..., isTest: false } }
  if (/isTest\s*:\s*false/.test(ahead)) {
    return true;
  }

  // Check if this query has a where clause at all
  if (!/where\s*:/.test(ahead)) {
    return false;
  }

  // Has where but no isTest: false — check if isTest is in the where
  const whereMatch = ahead.match(/where\s*:\s*\{([^}]*)\}/);
  if (whereMatch) {
    return /isTest/.test(whereMatch[1]);
  }

  return false;
}

function shouldExclude(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return EXCLUDED_DIRS.some(dir => normalized.includes(`/${dir}/`));
}

function main(): { passed: boolean; violations: Violation[] } {
  const rootDir = resolve(process.cwd());
  const files = globSync('src/lib/executive/**/*.ts', { cwd: rootDir, absolute: true });

  let allViolations: Violation[] = [];

  for (const file of files) {
    if (shouldExclude(file)) continue;
    const violations = analyzeFile(file);
    allViolations = allViolations.concat(violations);
  }

  if (allViolations.length > 0) {
    console.log('\nExecutive Governance Violations Detected:\n');

    for (const v of allViolations) {
      console.log(`  FAIL  ${v.model}`);
      console.log(`  File: ${v.file}`);
      console.log(`  Line: ${v.line}`);
      console.log(`  Fix:  Add { where: { isTest: false } } to exclude test data\n`);
    }

    console.log(`${allViolations.length} violation(s) found.\n`);
    return { passed: false, violations: allViolations };
  }

  console.log('\n✅ Executive Governance: All production queries are production-isolated.\n');
  return { passed: true, violations: [] };
}

const result = main();
process.exit(result.passed ? 0 : 1);
