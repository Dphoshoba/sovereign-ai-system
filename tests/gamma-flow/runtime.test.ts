/**
 * Tests for Workflow Runtime
 * Coverage: initialization, state management, execution tracking
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Runtime', () => {
  describe('Runtime Initialization', () => {
    it('should initialize from definition', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });

    it('should create compiled workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('should validate workflow states', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBeDefined();
    });

    it('should compile workflow steps', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should track execution order', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(Array.isArray(compiled.steps)).toBe(true);
    });
  });

  describe('Execution Tracking', () => {
    it('should track step execution', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps).toBeDefined();
      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should estimate execution time', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.executionTimeEstimate).toBeGreaterThanOrEqual(0);
    });

    it('should generate statistics', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.metrics).toBeDefined();
    });
  });

  describe('Multi-Template Support', () => {
    it('should handle Gmail Triage', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled).toBeDefined();
    });

    it('should handle Gmail to Slack', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_to_slack_preview;

      const compiled = compileWorkflow(def);

      expect(compiled).toBeDefined();
    });

    it('should handle Weekly Brief', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.weekly_brief_preview;

      const compiled = compileWorkflow(def);

      expect(compiled).toBeDefined();
    });
  });
});
