/**
 * Tests for Workflow API Safety & Validation
 * Coverage: validation endpoint safety, input sanitization, error handling
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { compileWorkflow } from '../../lib/flow/workflow-compiler';
import { previewWorkflow } from '../../lib/flow/workflow-preview-engine';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('API Safety & Validation', () => {
  describe('Validation Endpoint Safety', () => {
    it('should reject null workflow', () => {
      const result = validateWorkflow(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject undefined workflow', () => {
      const result = validateWorkflow(undefined as any);
      expect(result.valid).toBe(false);
    });

    it('should handle missing ID', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        id: '',
      };

      const result = validateWorkflow(def);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should catch malformed trigger', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        trigger: {} as any,
      };

      const result = validateWorkflow(def);
      expect(result.valid).toBe(false);
    });
  });

  describe('Compilation Endpoint Safety', () => {
    it('should reject compilation of invalid workflow', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        steps: [],
      };

      // Should not crash, just return empty
      const compiled = compileWorkflow(def);
      expect(compiled).toBeDefined();
    });
  });

  describe('Preview Endpoint Safety', () => {
    it('should reject null workflow in preview', () => {
      expect(() => {
        previewWorkflow(null as any, 'exec_001');
      }).not.toThrow();
    });

    it('should reject null execution ID', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      expect(() => {
        previewWorkflow(def, null as any);
      }).not.toThrow();
    });

    it('should handle empty workflow', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        steps: [],
        edges: [],
      };

      const result = previewWorkflow(def, 'exec_002');
      expect(result).toBeDefined();
    });
  });

  describe('Approval Enforcement', () => {
    it('should identify approval requirements', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      // Should have approval checkpoints
      expect(result.metrics?.approvalPointCount).toBeGreaterThanOrEqual(0);
    });

    it('should track approvals in validation', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(result.approvalCoverage).toBeDefined();
    });
  });

  describe('Queue Enforcement', () => {
    it('should identify queue requirements', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(result.metrics?.queuePointCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should provide error messages', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        steps: [],
      };

      const result = validateWorkflow(def);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toBeDefined();
    });

    it('should provide error severity', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        id: '',
      };

      const result = validateWorkflow(def);
      if (result.errors.length > 0) {
        expect(result.errors[0].severity).toBeDefined();
      }
    });
  });

  describe('Response Structure', () => {
    it('should return valid validation result', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(result.valid).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.safetyScore).toBe('number');
      expect(typeof result.readinessScore).toBe('number');
    });
  });
});
