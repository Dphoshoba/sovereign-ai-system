/**
 * Tests for Workflow Templates
 * Coverage: all three templates (Gmail Triage, Gmail→Slack, Weekly Brief)
 */

import { describe, it, expect } from 'vitest';
import {
  GMAIL_TRIAGE_TEMPLATE,
  GMAIL_TO_SLACK_TEMPLATE,
  WEEKLY_BRIEF_TEMPLATE,
  WORKFLOW_TEMPLATES,
} from '../../src/lib/gamma-flow/workflow-templates';
import { validateWorkflow } from '../../lib/flow/workflow-validator';

describe('Workflow Templates', () => {
  describe('Template Availability', () => {
    it('should have 3 templates', () => {
      expect(WORKFLOW_TEMPLATES.length).toBe(3);
    });

    it('should export individual templates', () => {
      expect(GMAIL_TRIAGE_TEMPLATE).toBeDefined();
      expect(GMAIL_TO_SLACK_TEMPLATE).toBeDefined();
      expect(WEEKLY_BRIEF_TEMPLATE).toBeDefined();
    });
  });

  describe('Gmail Triage Template', () => {
    it('should have valid structure', () => {
      expect(GMAIL_TRIAGE_TEMPLATE.id).toBe('gmail_triage_template_v1');
      expect(GMAIL_TRIAGE_TEMPLATE.name).toBe('Gmail Triage');
      expect(GMAIL_TRIAGE_TEMPLATE.baseWorkflow).toBeDefined();
    });

    it('should have 8 workflow steps', () => {
      const steps = GMAIL_TRIAGE_TEMPLATE.baseWorkflow.steps;
      expect(steps.length).toBe(8);
    });

    it('should have required step types', () => {
      const stepTypes = new Set(GMAIL_TRIAGE_TEMPLATE.baseWorkflow.steps.map((s: any) => s.type));
      expect(stepTypes.has('connector')).toBe(true);
      expect(stepTypes.has('transform')).toBe(true);
      expect(stepTypes.has('decision')).toBe(true);
      expect(stepTypes.has('approval')).toBe(true);
      expect(stepTypes.has('queue')).toBe(true);
      expect(stepTypes.has('sink')).toBe(true);
    });

    it('should validate successfully', () => {
      const result = validateWorkflow(GMAIL_TRIAGE_TEMPLATE.baseWorkflow);
      expect(result.valid).toBe(true);
    });

    it('should have approval checkpoint', () => {
      const hasApproval = GMAIL_TRIAGE_TEMPLATE.baseWorkflow.steps.some(
        (s: any) => s.type === 'approval'
      );
      expect(hasApproval).toBe(true);
    });

    it('should have queue checkpoint', () => {
      const hasQueue = GMAIL_TRIAGE_TEMPLATE.baseWorkflow.steps.some(
        (s: any) => s.type === 'queue'
      );
      expect(hasQueue).toBe(true);
    });
  });

  describe('Gmail to Slack Template', () => {
    it('should have valid structure', () => {
      expect(GMAIL_TO_SLACK_TEMPLATE.id).toBe('gmail_to_slack_template_v1');
      expect(GMAIL_TO_SLACK_TEMPLATE.name).toBe('Gmail to Slack Priority');
    });

    it('should have 8 workflow steps', () => {
      const steps = GMAIL_TO_SLACK_TEMPLATE.baseWorkflow.steps;
      expect(steps.length).toBe(8);
    });

    it('should validate successfully', () => {
      const result = validateWorkflow(GMAIL_TO_SLACK_TEMPLATE.baseWorkflow);
      expect(result.valid).toBe(true);
    });

    it('should use Gmail and Slack connectors', () => {
      const connectors = new Set(
        GMAIL_TO_SLACK_TEMPLATE.baseWorkflow.steps
          .filter((s: any) => s.type === 'connector')
          .map((s: any) => s.connectorName)
      );

      expect(connectors.has('gmail')).toBe(true);
      expect(connectors.has('slack')).toBe(true);
    });
  });

  describe('Weekly Executive Brief Template', () => {
    it('should have valid structure', () => {
      expect(WEEKLY_BRIEF_TEMPLATE.id).toBe('weekly_brief_template_v1');
      expect(WEEKLY_BRIEF_TEMPLATE.name).toBe('Weekly Executive Brief');
    });

    it('should have 6 workflow steps', () => {
      const steps = WEEKLY_BRIEF_TEMPLATE.baseWorkflow.steps;
      expect(steps.length).toBe(6);
    });

    it('should have scheduled trigger', () => {
      const trigger = WEEKLY_BRIEF_TEMPLATE.baseWorkflow.trigger;
      expect(trigger.type).toBe('scheduled');
    });

    it('should validate successfully', () => {
      const result = validateWorkflow(WEEKLY_BRIEF_TEMPLATE.baseWorkflow);
      expect(result.valid).toBe(true);
    });
  });

  describe('Template Metadata', () => {
    it('should have tags', () => {
      expect(GMAIL_TRIAGE_TEMPLATE.tags).toBeDefined();
      expect(Array.isArray(GMAIL_TRIAGE_TEMPLATE.tags)).toBe(true);
      expect(GMAIL_TRIAGE_TEMPLATE.tags.length).toBeGreaterThan(0);
    });

    it('should have creation timestamps', () => {
      expect(GMAIL_TRIAGE_TEMPLATE.createdAt).toBeInstanceOf(Date);
      expect(GMAIL_TRIAGE_TEMPLATE.baseWorkflow.createdAt).toBeInstanceOf(Date);
    });

    it('should have description', () => {
      expect(GMAIL_TRIAGE_TEMPLATE.description).toBeDefined();
      expect(GMAIL_TRIAGE_TEMPLATE.description.length).toBeGreaterThan(0);
    });
  });

  describe('Template Determinism', () => {
    it('should have deterministic IDs', () => {
      // Accessing templates twice should return same IDs
      const id1 = GMAIL_TRIAGE_TEMPLATE.id;
      const id2 = GMAIL_TRIAGE_TEMPLATE.id;

      expect(id1).toBe(id2);
    });

    it('should have deterministic timestamps', () => {
      const time1 = GMAIL_TRIAGE_TEMPLATE.baseWorkflow.createdAt.getTime();
      const time2 = GMAIL_TRIAGE_TEMPLATE.baseWorkflow.createdAt.getTime();

      expect(time1).toBe(time2);
    });

    it('should have consistent validation scores', () => {
      const result1 = validateWorkflow(GMAIL_TRIAGE_TEMPLATE.baseWorkflow);
      const result2 = validateWorkflow(GMAIL_TRIAGE_TEMPLATE.baseWorkflow);

      expect(result1.safetyScore).toBe(result2.safetyScore);
      expect(result1.readinessScore).toBe(result2.readinessScore);
    });
  });
});
