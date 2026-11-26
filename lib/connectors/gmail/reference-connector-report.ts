/**
 * Reference Connector Report
 *
 * Generates documentation on which Gmail components are reusable
 * for future connectors (Calendar, Drive, GitHub, Slack, etc.)
 */

import type { ConnectorBlueprintComponent, ReferenceArchitecture } from '../../../src/lib/gmail-certification/types';
import { MOCK_BLUEPRINT_COMPONENTS, MOCK_REFERENCE_ARCHITECTURE } from '../../../src/lib/gmail-certification/mock-data';

export class ReferenceConnectorReport {
  /**
   * Get blueprint components
   */
  getBlueprintComponents(): ConnectorBlueprintComponent[] {
    return MOCK_BLUEPRINT_COMPONENTS;
  }

  /**
   * Get reference architecture
   */
  getReferenceArchitecture(): ReferenceArchitecture {
    return MOCK_REFERENCE_ARCHITECTURE;
  }

  /**
   * Get critical components (must copy exactly)
   */
  getCriticalComponents(): ConnectorBlueprintComponent[] {
    return MOCK_BLUEPRINT_COMPONENTS.filter(
      (c) =>
        MOCK_REFERENCE_ARCHITECTURE.criticalReuse.some((name) =>
          c.name.toLowerCase().includes(name.toLowerCase())
        )
    );
  }

  /**
   * Get recommended components (should copy)
   */
  getRecommendedComponents(): ConnectorBlueprintComponent[] {
    return MOCK_BLUEPRINT_COMPONENTS.filter(
      (c) =>
        MOCK_REFERENCE_ARCHITECTURE.recommendedReuse.some((name) =>
          c.name.toLowerCase().includes(name.toLowerCase())
        )
    );
  }

  /**
   * Get reference-only components (learn from but implement uniquely)
   */
  getReferenceOnlyComponents(): ConnectorBlueprintComponent[] {
    return MOCK_BLUEPRINT_COMPONENTS.filter(
      (c) =>
        MOCK_REFERENCE_ARCHITECTURE.referenceOnly.some((name) =>
          c.name.toLowerCase().includes(name.toLowerCase())
        )
    );
  }

  /**
   * Get components needed for specific future connector
   */
  getComponentsForConnector(connectorName: string): ConnectorBlueprintComponent[] {
    return MOCK_BLUEPRINT_COMPONENTS.filter((c) =>
      c.futureConnectors.some((fc) => fc.toLowerCase() === connectorName.toLowerCase())
    );
  }

  /**
   * Get components by reusability status
   */
  getComponentsByStatus(status: 'reusable-as-is' | 'reusable-with-adaptation' | 'reference-only'): ConnectorBlueprintComponent[] {
    return MOCK_BLUEPRINT_COMPONENTS.filter((c) => c.status === status);
  }

  /**
   * Get estimated development reduction percentage
   */
  getEstimatedDevelopmentReduction(connectorName: string): number {
    const components = this.getComponentsForConnector(connectorName);
    const asIsComponents = components.filter((c) => c.status === 'reusable-as-is').length;
    const withAdaptationComponents = components.filter((c) => c.status === 'reusable-with-adaptation').length;

    // Rough estimate: 100% * asIs + 60% * withAdaptation
    const reduction = (asIsComponents + withAdaptationComponents * 0.6) / components.length;
    return Math.round(reduction * 100);
  }

  /**
   * Generate markdown documentation for blueprint
   */
  generateMarkdownDocumentation(): string {
    const arch = this.getReferenceArchitecture();
    const critical = this.getCriticalComponents();
    const recommended = this.getRecommendedComponents();
    const reference = this.getReferenceOnlyComponents();

    return `# Gmail Connector Reference Architecture

## Overview

This is the reusable blueprint for all future connectors in Gamma Phase XV.

## Critical Components (Copy Exactly)

${critical.map((c) => `### ${c.name}\n- **File**: ${c.location}\n- **Reuse Pattern**: ${c.reusePattern}\n- **Description**: ${c.description}`).join('\n\n')}

## Recommended Components (Should Copy)

${recommended.map((c) => `### ${c.name}\n- **File**: ${c.location}\n- **Reuse Pattern**: ${c.reusePattern}\n- **Description**: ${c.description}`).join('\n\n')}

## Reference-Only Components (Learn From)

${reference.map((c) => `### ${c.name}\n- **File**: ${c.location}\n- **Reuse Pattern**: ${c.reusePattern}\n- **Description**: ${c.description}`).join('\n\n')}

## Best Practices

${arch.bestPractices.map((p) => `- ${p}`).join('\n')}

## Future Connectors

These components support the following connectors:

- Calendar
- Drive
- GitHub
- Slack
- Office 365
- Notion
- Discord
`;
  }

  /**
   * Get roadmap for future connector
   */
  getRoadmapForConnector(connectorName: string): {
    steps: string[];
    estimatedReduction: number;
    componentsToReuse: ConnectorBlueprintComponent[];
    uniqueComponents: string[];
  } {
    const components = this.getComponentsForConnector(connectorName);
    const reduction = this.getEstimatedDevelopmentReduction(connectorName);

    return {
      steps: [
        `1. Copy OAuth adapter from Gmail`,
        `2. Adapt to ${connectorName} API endpoints and scopes`,
        `3. Implement ${connectorName}-specific reader (copy mailbox-reader pattern)`,
        `4. Copy approval, queue, execution, compliance frameworks unchanged`,
        `5. Implement ${connectorName}-specific health monitoring`,
        `6. Write tests following Gmail certification patterns`,
        `7. Run certification suite`,
      ],
      estimatedReduction: reduction,
      componentsToReuse: components,
      uniqueComponents: [
        `${connectorName}-specific API methods`,
        `${connectorName}-specific data models`,
        `${connectorName}-specific error handling`,
      ],
    };
  }
}
