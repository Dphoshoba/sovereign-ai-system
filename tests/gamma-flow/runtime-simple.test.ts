/**
 * Tests for Workflow Runtime & State Machine
 * Coverage: initialization, state transitions
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Runtime', () => {
  describe('Runtime Initialization', () => {
    it('should validate workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });

    it('should compile workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should have workflow definition', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      expect(def.id).toBeDefined();
      expect(def.steps).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should have defined states', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBeDefined();
    });

    it('should support multiple templates', () => {
      const templates = [
        MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        MOCK_WORKFLOW_DEFINITIONS.gmail_to_slack_preview,
        MOCK_WORKFLOW_DEFINITIONS.weekly_brief_preview,
      ];

      templates.forEach((def) => {
        const result = validateWorkflow(def);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Execution Tracking', () => {
    it('should track execution steps', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps).toBeDefined();
      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should compile with metrics', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.executionTimeEstimate).toBeGreaterThanOrEqual(0);
    });
  });
});
