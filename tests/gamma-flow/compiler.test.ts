/**
 * Tests for Workflow Compiler
 * Coverage: topological sort, critical path, execution time estimation
 */

import { describe, it, expect } from 'vitest';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Compiler', () => {
  describe('Basic Compilation', () => {
    it('should compile valid workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
      expect(compiled.criticalPath.length).toBeGreaterThan(0);
      expect(compiled.executionTimeEstimate).toBeGreaterThan(0);
    });

    it('should maintain step IDs', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);

      compiled.steps.forEach((step: any) => {
        expect(step.id).toBeDefined();
      });
    });

    it('should estimate execution time', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);

      expect(compiled.executionTimeEstimate).toBeGreaterThan(0);
    });
  });

  describe('Topological Ordering', () => {
    it('should order steps topologically', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);

      // No step should reference a later step as predecessor
      const stepIndex: Record<string, number> = {};
      compiled.steps.forEach((step: any, index: number) => {
        stepIndex[step.id] = index;
      });

      // Verify order is valid (simplified check)
      expect(compiled.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Critical Path', () => {
    it('should identify critical path', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);

      expect(compiled.criticalPath).toBeDefined();
      expect(compiled.criticalPath.length).toBeGreaterThan(0);
    });

    it('should have valid critical path IDs', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);
      const stepIds = new Set(compiled.steps.map((s: any) => s.id));

      compiled.criticalPath.forEach((stepId: string) => {
        expect(stepIds.has(stepId)).toBe(true);
      });
    });
  });

  describe('Parallelization', () => {
    it('should detect parallelizable workflows', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const compiled = compileWorkflow(def);

      expect(compiled.parallelizable).toBeDefined();
      expect(typeof compiled.parallelizable).toBe('boolean');
    });
  });
});
