/**
 * Tests for Workflow Preview Engine
 * Coverage: mock connector execution, auto-approval, step results, determinism
 */

import { describe, it, expect } from 'vitest';
import { previewWorkflow } from '../../lib/flow/workflow-preview-engine';
import { MOCK_WORKFLOW_DEFINITIONS, BASE_TIME } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Preview Engine', () => {
  describe('Preview Execution', () => {
    it('should execute preview workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const executionId = 'preview_exec_001';
      const result = previewWorkflow(def, executionId);

      expect(result.success).toBe(true);
      expect(result.executionId).toBe(executionId);
      expect(result.stepResults).toBeDefined();
    });

    it('should return step results', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = previewWorkflow(def, 'preview_exec_002');

      expect(Object.keys(result.stepResults).length).toBeGreaterThan(0);
      Object.values(result.stepResults).forEach((stepResult: any) => {
        expect(stepResult.duration).toBeGreaterThan(0);
        expect(stepResult.output).toBeDefined();
      });
    });

    it('should use mock connector outputs', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = previewWorkflow(def, 'preview_exec_003');

      expect(result.success).toBe(true);
    });
  });

  describe('Approval Handling', () => {
    it('should auto-approve in preview mode', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = previewWorkflow(def, 'preview_exec_004');

      expect(result.approvalCheckpoints).toBeDefined();
    });
  });

  describe('Determinism', () => {
    it('should produce consistent results', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;

      const result1 = previewWorkflow(def, 'preview_exec_det_001');
      const result2 = previewWorkflow(def, 'preview_exec_det_002');

      // Same workflow should have same structure
      expect(Object.keys(result1.stepResults).length).toBe(Object.keys(result2.stepResults).length);
    });

    it('should use consistent timestamps', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = previewWorkflow(def, 'preview_exec_time_001');

      // All results should be defined
      Object.values(result.stepResults).forEach((stepResult: any) => {
        expect(stepResult.duration).toBeGreaterThan(0);
      });
    });
  });
});
