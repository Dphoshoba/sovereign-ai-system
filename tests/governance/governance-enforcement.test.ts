import { describe, it, expect } from 'vitest';

const analyzeFile = (content: string, filePath: string): string[] => {
  const GOVERNED_MODELS = ['CreatorLead', 'ClientProfile', 'CreatorProposal', 'ClientProject', 'ClientProjectTask', 'ClientInvoice'];
  const violations: string[] = [];

  for (const model of GOVERNED_MODELS) {
    const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
    const pattern = new RegExp(`prisma\\.${camelModel}\\.(findMany|findUnique|findFirst|create|update|upsert|delete)\\s*\\(`, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      const lines = content.split('\n');

      const hasExclusionComment = lines[line - 2]?.includes('executive-governance-ignore') || lines[line - 1]?.includes('executive-governance-ignore');
      if (hasExclusionComment) continue;

      const ahead = content.slice(match.index, match.index + 600);
      if (!ahead.includes('isTest')) {
        violations.push(`${filePath}:${line}: ${model} query missing isTest filter`);
      }
    }
  }

  return violations;
};

describe('Executive Governance — Governance Enforcement Platform', () => {

  it('compliant query passes validation', () => {
    const content = `await prisma.creatorLead.findMany({ where: { isTest: false } });`;
    const violations = analyzeFile(content, 'test.ts');
    expect(violations.length).toBe(0);
  });

  it('compliant query with existing where and isTest passes', () => {
    const content = `await prisma.creatorLead.findMany({ where: { status: "active", isTest: false } });`;
    const violations = analyzeFile(content, 'test.ts');
    expect(violations.length).toBe(0);
  });

  it('compliant query with options and where passes', () => {
    const content = `await prisma.creatorLead.findMany({ where: { isTest: false }, orderBy: { createdAt: "desc" }, take: 10 });`;
    const violations = analyzeFile(content, 'test.ts');
    expect(violations.length).toBe(0);
  });

  it('missing isTest filter produces violation', () => {
    const content = `await prisma.creatorLead.findMany();`;
    const violations = analyzeFile(content, 'governed.ts');
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain('CreatorLead');
    expect(violations[0]).toContain('isTest');
  });

  it('where clause without isTest produces violation', () => {
    const content = `await prisma.creatorLead.findMany({ where: { status: "active" } });`;
    const violations = analyzeFile(content, 'governed.ts');
    expect(violations.length).toBe(1);
  });

  it('executive-governance-ignore excludes query', () => {
    const content = `// executive-governance-ignore\nawait prisma.creatorLead.findMany();`;
    const violations = analyzeFile(content, 'excluded.ts');
    expect(violations.length).toBe(0);
  });

  it('executive-governance-ignore on same line excludes query', () => {
    const content = `await prisma.creatorLead.findMany(); // executive-governance-ignore`;
    const violations = analyzeFile(content, 'excluded.ts');
    expect(violations.length).toBe(0);
  });

  it('all six governed models are checked', () => {
    const models = ['creatorLead', 'clientProfile', 'creatorProposal', 'clientProject', 'clientProjectTask', 'clientInvoice'];
    for (const model of models) {
      const violations = analyzeFile(`prisma.${model}.findMany();`, 'test.ts');
      expect(violations.length).toBe(1);
    }
  });

  it('findUnique and findFirst are checked', () => {
    expect(analyzeFile(`prisma.clientProfile.findUnique({ where: { id: "x" } });`, 't.ts').length).toBe(1);
    expect(analyzeFile(`prisma.clientProject.findFirst({ where: { title: "x", isTest: false } });`, 't.ts').length).toBe(0);
  });

  it('non-governed models are not checked', () => {
    const violations = analyzeFile(`prisma.quarterlyGoal.findMany(); prisma.article.findMany();`, 'test.ts');
    expect(violations.length).toBe(0);
  });

  it('create and update operations are checked', () => {
    expect(analyzeFile(`prisma.creatorLead.create({ data: { name: "x" } });`, 't.ts').length).toBe(1);
    expect(analyzeFile(`prisma.clientInvoice.update({ where: { id: "x" }, data: { status: "paid" } });`, 't.ts').length).toBe(1);
  });
});
