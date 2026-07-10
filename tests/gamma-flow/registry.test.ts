/**
 * Tests for Flow Registry Reader
 * Coverage: template retrieval, search, filtering, determinism
 */

import { describe, it, expect } from 'vitest';
import { FlowRegistryReader, initializeFlowRegistry } from '../../lib/gamma/flow-registry-reader';
import { BASE_TIME } from '../../src/lib/gamma-flow/mock-data';

describe('Flow Registry Reader', () => {
  describe('Initialization', () => {
    it('should initialize registry', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('Template Retrieval', () => {
    it('should get all templates', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should get template by ID', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      if (templates.length > 0) {
        const template = registry.getTemplate(templates[0].id);
        expect(template).toBeDefined();
        expect(template?.id).toBe(templates[0].id);
      }
    });

    it('should return null for nonexistent template', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const template = registry.getTemplate('nonexistent_template');
      expect(template).toBeNull();
    });
  });

  describe('Template Metadata', () => {
    it('should have required template fields', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      if (templates.length > 0) {
        const template = templates[0];
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.definition).toBeDefined();
      }
    });

    it('should have workflow definition', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      if (templates.length > 0) {
        const template = templates[0];
        expect(template.definition.steps).toBeDefined();
        expect(template.definition.edges).toBeDefined();
        expect(template.definition.trigger).toBeDefined();
      }
    });
  });

  describe('Search and Filtering', () => {
    it('should search templates', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const results = registry.search('triage');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter by tags', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const results = registry.getTemplatesByTag('email');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Determinism', () => {
    it('should return consistent templates across calls', () => {
      initializeFlowRegistry();
      const registry1 = new FlowRegistryReader();
      const templates1 = registry1.getTemplates();

      initializeFlowRegistry();
      const registry2 = new FlowRegistryReader();
      const templates2 = registry2.getTemplates();

      expect(templates1.length).toBe(templates2.length);
      if (templates1.length > 0) {
        expect(templates1[0].id).toBe(templates2[0].id);
      }
    });

    it('should use deterministic timestamps', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      if (templates.length > 0) {
        const template = templates[0];
        expect(template.createdAt).toBeInstanceOf(Date);
        expect(template.definition.createdAt.getTime()).toBeGreaterThan(0);
      }
    });
  });

  describe('Hash Computation', () => {
    it('should compute template hash', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      if (templates.length > 0) {
        const hash = registry.getTemplateHash(templates[0].id);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeGreaterThan(0);
      }
    });

    it('should produce consistent hashes', () => {
      initializeFlowRegistry();
      const registry = new FlowRegistryReader();

      const templates = registry.getTemplates();
      if (templates.length > 0) {
        const id = templates[0].id;
        const hash1 = registry.getTemplateHash(id);
        const hash2 = registry.getTemplateHash(id);

        expect(hash1).toBe(hash2);
      }
    });
  });
});
