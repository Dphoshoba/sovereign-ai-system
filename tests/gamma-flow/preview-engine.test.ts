/**
 * Tests for Workflow Preview Engine
 * Coverage: validation, compilation, determinism
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { MOCK_WORKFLOW_DEFINITIONS, BASE_TIME } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Preview Engine', () => {
  describe('Validation', () => {
    it('should validate preview workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });

    it('should compile preview workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps.length).toBeGreaterThan(0);
    });

    it('should return compiled steps', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled = compileWorkflow(def);

      expect(compiled.steps).toBeDefined();
      expect(Array.isArray(compiled.steps)).toBe(true);
    });

    it('should support mock outputs', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });
  });

  describe('Approval Handling', () => {
    it('should identify approval points', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.metrics?.approvalPointCount).toBeDefined();
    });
  });

  describe('Determinism', () => {
    it('should validate consistently', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = validateWorkflow(def);
      const result2 = validateWorkflow(def);

      expect(result1.valid).toBe(result2.valid);
    });

    it('should compile consistently', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const compiled1 = compileWorkflow(def);
      const compiled2 = compileWorkflow(def);

      expect(compiled1.steps.length).toBe(compiled2.steps.length);
    });

    it('should use consistent timestamps', () => {
      expect(BASE_TIME).toEqual(new Date('2026-07-10T12:00:00Z'));
    });
  });

  describe('Template Support', () => {
    it('should support Gmail Triage', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });

    it('should support Gmail to Slack', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_to_slack_preview;

      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
    });
  });
});
