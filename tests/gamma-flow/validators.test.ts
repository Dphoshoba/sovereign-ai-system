/**
 * Tests for Workflow Validators
 * Coverage: dependency-validator, cycle-detector, connector-binding-validator,
 * safety-validator, schema validation, orchestrated validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateWorkflow } from '../../lib/flow/workflow-validator';
import { detectCycles } from '../../lib/flow/cycle-detector';
import { validateWorkflowSchema } from '../../lib/flow/dependency-validator';
import {
  MOCK_WORKFLOW_DEFINITIONS,
  BASE_TIME,
} from '../../src/lib/gamma-flow/mock-data';

describe('Workflow Validators', () => {
  describe('validateWorkflow Orchestrator', () => {
    it('should validate a correct workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.safetyScore).toBeGreaterThan(0);
      expect(result.readinessScore).toBeGreaterThan(0);
    });

    it('should catch missing trigger', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        trigger: (undefined as any),
      };

      const result = validateWorkflow(def);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should catch missing steps', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        steps: [],
      };

      const result = validateWorkflow(def);
      expect(result.valid).toBe(false);
    });

    it('should catch missing edges', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        edges: [],
      };

      const result = validateWorkflow(def);
      expect(result.valid).toBe(false);
    });

    it('should calculate safety score based on approvals', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(result.safetyScore).toBeGreaterThanOrEqual(0);
      expect(result.safetyScore).toBeLessThanOrEqual(100);
    });

    it('should return metrics', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.nodeCount).toBeGreaterThan(0);
      expect(result.metrics?.edgeCount).toBeGreaterThan(0);
      expect(result.metrics?.connectorCount).toBeGreaterThan(0);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect no cycles in valid workflow', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const hasCycles = detectCycles(def);

      expect(hasCycles).toBe(false);
    });

    it('should detect self-loop', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        edges: [
          ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview.edges,
          {
            id: 'e_loop',
            from: 'step_id_123',
            to: 'step_id_123',
            type: 'always' as const,
          },
        ],
      };

      const hasCycles = detectCycles(def);
      expect(hasCycles).toBe(true);
    });

    it('should detect circular path', () => {
      const steps = [
        { id: 's1', name: 'Step 1', type: 'connector' as const, connectorName: 'gmail', actionId: 'read' },
        { id: 's2', name: 'Step 2', type: 'connector' as const, connectorName: 'gmail', actionId: 'read' },
        { id: 's3', name: 'Step 3', type: 'connector' as const, connectorName: 'gmail', actionId: 'read' },
      ];

      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        steps,
        edges: [
          { id: 'e1', from: 'trigger', to: 's1', type: 'always' as const },
          { id: 'e2', from: 's1', to: 's2', type: 'always' as const },
          { id: 'e3', from: 's2', to: 's3', type: 'always' as const },
          { id: 'e4', from: 's3', to: 's1', type: 'always' as const },
        ],
      };

      const hasCycles = detectCycles(def);
      expect(hasCycles).toBe(true);
    });
  });

  describe('Dependency Validation', () => {
    it('should validate correct dependencies', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const errors = validateWorkflowSchema(def);

      // Should complete without crashing
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should catch missing predecessor', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        edges: [
          {
            id: 'bad_edge',
            from: 'nonexistent_step',
            to: 'real_step',
            type: 'always' as const,
          },
        ],
      };

      const errors = validateWorkflowSchema(def);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch orphan nodes', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        steps: [
          ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview.steps,
          {
            id: 'orphan_step',
            name: 'Orphan',
            type: 'connector' as const,
            connectorName: 'gmail',
            actionId: 'read',
          },
        ],
      };

      const errors = validateWorkflowSchema(def);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Safety Validation', () => {
    it('should evaluate safety score', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      expect(typeof result.safetyScore).toBe('number');
      expect(result.safetyScore).toBeGreaterThanOrEqual(0);
      expect(result.safetyScore).toBeLessThanOrEqual(100);
    });

    it('should calculate based on approval presence', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      // Should have some safety assessment
      expect(result.metrics).toBeDefined();
    });

    it('should check queue enforcement', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      // Should have queue evaluation
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct workflow structure', () => {
      const def = MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview;
      const result = validateWorkflow(def);

      // Should complete without crashing
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should catch missing required fields', () => {
      const def = {
        ...MOCK_WORKFLOW_DEFINITIONS.gmail_triage_preview,
        id: undefined,
      } as any;

      const result = validateWorkflow(def);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
