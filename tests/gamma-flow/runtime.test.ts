/**
 * Tests for Workflow Runtime & State Machine
 * Coverage: state transitions, guards, execution tracking, statistics
 */

import { describe, it, expect } from 'vitest';
import {
  createRuntime,
  canTransition,
  transitionRuntime,
  recordStepExecution,
} from '../../lib/flow/workflow-runtime';
import { MOCK_WORKFLOW_DEFINITIONS } from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Runtime', () => {
  describe('Runtime Initialization', () => {
    it('should create runtime from definition', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const runtime = createRuntime(def, 'runtime_001');

      expect(runtime.executionId).toBe('runtime_001');
      expect(runtime.definition).toBeDefined();
      expect(runtime.state).toBe('draft');
    });

    it('should initialize empty audit log', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const runtime = createRuntime(def, 'runtime_002');

      expect(runtime.auditEvents).toBeDefined();
      expect(Array.isArray(runtime.auditEvents)).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow draft→validated', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const runtime = createRuntime(def, 'runtime_003');

      const canGo = canTransition(runtime, 'validated');
      expect(canGo).toBe(true);
    });

    it('should not allow invalid transitions', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const runtime = createRuntime(def, 'runtime_004');

      // Can't go directly from draft to running_preview
      const canGo = canTransition(runtime, 'running_preview');
      expect(canGo).toBe(false);
    });

    it('should transition to validated state', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      let runtime = createRuntime(def, 'runtime_005');

      runtime = transitionRuntime(runtime, 'validated');
      expect(runtime.state).toBe('validated');
    });

    it('should enforce transition sequence', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      let runtime = createRuntime(def, 'runtime_006');

      // validated → ready
      runtime = transitionRuntime(runtime, 'validated');
      runtime = transitionRuntime(runtime, 'ready');
      expect(runtime.state).toBe('ready');
    });
  });

  describe('Execution Tracking', () => {
    it('should record step execution', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      let runtime = createRuntime(def, 'runtime_007');

      const stepId = 'step_1';
      const result = { output: 'test', duration: 100 };
      runtime = recordStepExecution(runtime, stepId, 'completed', result);

      expect(runtime.context.stepResults[stepId]).toBeDefined();
    });

    it('should track execution statistics', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      let runtime = createRuntime(def, 'runtime_008');

      runtime = transitionRuntime(runtime, 'validated');
      runtime = transitionRuntime(runtime, 'ready');

      // Record some step executions
      runtime = recordStepExecution(runtime, 'step_1', 'completed', { output: 'ok', duration: 100 });

      const stats = {
        stepResults: Object.keys(runtime.context.stepResults),
      };

      expect(stats.stepResults.length).toBeGreaterThan(0);
    });
  });

  describe('Timestamp Tracking', () => {
    it('should track timestamps', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const runtime = createRuntime(def, 'runtime_009');

      expect(runtime.timestamps.createdAt).toBeDefined();
      expect(runtime.timestamps.createdAt).toBeInstanceOf(Date);
    });
  });
});
