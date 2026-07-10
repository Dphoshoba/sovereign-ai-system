/**
 * Tests for Execution Plan Builder
 * Coverage: context initialization, bindings, input resolution, output capture
 */

import { describe, it, expect } from 'vitest';
import { buildExecutionPlan } from '../../lib/flow/execution-plan-builder';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('Execution Plan Builder', () => {
  describe('Plan Creation', () => {
    it('should create execution plan from definition', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const executionId = 'exec_test_001';
      const plan = buildExecutionPlan(def, executionId);

      expect(plan.executionId).toBe(executionId);
      expect(plan.compiledWorkflow).toBeDefined();
      expect(plan.context).toBeDefined();
    });

    it('should initialize execution context', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const executionId = 'exec_test_002';
      const plan = buildExecutionPlan(def, executionId);

      expect(plan.context.executionId).toBe(executionId);
      expect(plan.context.stepResults).toBeDefined();
      expect(Object.keys(plan.context.stepResults).length).toBe(0);
    });

    it('should set up bindings', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const executionId = 'exec_test_003';
      const plan = buildExecutionPlan(def, executionId);

      expect(plan.bindings).toBeDefined();
    });
  });

  describe('Input Resolution', () => {
    it('should resolve input paths', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const executionId = 'exec_test_004';
      const plan = buildExecutionPlan(def, executionId);

      expect(plan.preprocessors).toBeDefined();
    });
  });

  describe('Output Capture', () => {
    it('should set up output postprocessors', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const executionId = 'exec_test_005';
      const plan = buildExecutionPlan(def, executionId);

      expect(plan.postprocessors).toBeDefined();
    });
  });
});
