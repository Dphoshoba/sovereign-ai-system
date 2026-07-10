/**
 * Tests for Execution Plan Builder
 * Coverage: validation, compilation, planning
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('Execution Plan Builder', () => {
  describe('Validation Before Planning', () => {
    it('should validate workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });

    it('should compile workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps).toBeDefined();
      expect(compiled.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow Structure', () => {
    it('should have trigger', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      expect(def.trigger).toBeDefined();
    });

    it('should have steps', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      expect(def.steps).toBeDefined();
      expect(def.steps.length).toBeGreaterThan(0);
    });

    it('should have edges', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      expect(def.edges).toBeDefined();
    });
  });

  describe('Multi-Template Support', () => {
    it('should support Gmail Triage', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should support Gmail to Slack', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_to_slack_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should support Weekly Brief', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.weekly_brief_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
    });
  });
});
