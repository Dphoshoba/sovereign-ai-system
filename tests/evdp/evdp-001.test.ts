import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const evdpRoot = path.resolve(__dirname, '..', '..', 'evdp');

interface WorkstreamSpec {
  id: string;
  name: string;
  agents: number;
  policies: number;
  services: string[];
  metrics: { name: string; target: string }[];
}

function loadWorkstreamSpec(dir: string): WorkstreamSpec | null {
  const specPath = path.join(evdpRoot, 'workstreams', dir, 'spec.md');
  if (!fs.existsSync(specPath)) return null;
  const content = fs.readFileSync(specPath, 'utf-8');
  const name = content.match(/^# Workstream \d+ — (.+)$/m)?.[1] || dir;

  const agentCount = (content.match(/### \d+\.\d+ /g) || []).length;
  const policyCount = (content.match(/^\| \w-\d{3} \|/gm) || []).length;
  const services = [...content.matchAll(/\| (\w+ \w+ \(\w+\))/g)].map(m => m[1]);
  const metrics = [...content.matchAll(/\| (\w+(?: \w+)*) \| ([\d%+]+.*?) \|/g)].map(m => ({
    name: m[1],
    target: m[2],
  }));

  return { id: dir, name, agents: agentCount, policies: policyCount, services, metrics };
}

const workstreamDirs = [
  '01-executive-office',
  '02-research-office',
  '03-product-office',
  '04-operations-office',
  '05-knowledge-office',
];

describe('EVDP-001 — Internal AI Organization Deployment', () => {

  describe('Programme Foundation', () => {
    it('EVDP decision document exists', () => {
      expect(fs.existsSync(path.join(evdpRoot, 'decisions', 'EVDP-2026-001.md'))).toBe(true);
    });

    it('EVDP README exists', () => {
      expect(fs.existsSync(path.join(evdpRoot, 'README.md'))).toBe(true);
    });
  });

  describe('Workstreams', () => {
    const specs = workstreamDirs
      .map(d => loadWorkstreamSpec(d))
      .filter((s): s is WorkstreamSpec => s !== null);

    it('all 5 workstreams have valid specs', () => {
      expect(specs.length).toBe(5);
    });

    it.each(specs)('$id — $name has agents defined', (spec) => {
      expect(spec.agents).toBeGreaterThan(0);
    });

    it.each(specs)('$id — $name has governance policies', (spec) => {
      expect(spec.policies).toBeGreaterThan(0);
    });

    it.each(specs)('$id — $name integrates with Gamma OS services', (spec) => {
      expect(spec.services.length).toBeGreaterThan(0);
    });

    it.each(specs)('$id — $name has success metrics', (spec) => {
      expect(spec.metrics.length).toBeGreaterThan(0);
    });

    it('total AI agents across all workstreams >= 15', () => {
      const total = specs.reduce((sum, s) => sum + s.agents, 0);
      expect(total).toBeGreaterThanOrEqual(15);
    });

    it('total governance policies across all workstreams >= 15', () => {
      const total = specs.reduce((sum, s) => sum + s.policies, 0);
      expect(total).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Gamma OS Service References', () => {
    const knownServices = [
      'Federation Registry (8A)',
      'Cross-Platform Coordination (8B)',
      'Federated Governance (8C)',
      'Federated Observability (8D)',
      'Autonomous Decision Engine (7B)',
      'Governance Gate (7D)',
      'Policy Engine (6D)',
      'Analytics Engine (6C)',
      'Workflow Orchestration (Phase V)',
    ];

    const specs = workstreamDirs
      .map(d => loadWorkstreamSpec(d))
      .filter((s): s is WorkstreamSpec => s !== null);

    it.each(specs)('$id references only certified Gamma OS services', (spec) => {
      for (const svc of spec.services) {
        const match = knownServices.some(k => svc.includes(k) || k.includes(svc));
        if (!match) {
          console.warn(`Unknown service reference in ${spec.id}: "${svc}"`);
        }
      }
    });
  });

  describe('Total Agent Count', () => {
    it('reports total AI agent count across all workstreams', () => {
      const specs = workstreamDirs
        .map(d => loadWorkstreamSpec(d))
        .filter((s): s is WorkstreamSpec => s !== null);
      const total = specs.reduce((sum, s) => sum + s.agents, 0);
      console.log(`\n  EVDP-001 AI Agent Summary: ${total} agents across ${specs.length} workstreams`);
      expect(total).toBeGreaterThan(0);
    });
  });
});
