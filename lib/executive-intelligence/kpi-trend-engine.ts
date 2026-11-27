import { KpiDefinition, KpiMeasurement, KpiTrendResult, KpiTrendDirection } from './kpi-registry-types';

const TREND_STABILITY_THRESHOLD = 0.05;
const MAX_MEASUREMENT_AGE_MS = 86400000 * 90;

export class KpiTrendEngine {

  calculateTrend(definition: KpiDefinition, measurements: KpiMeasurement[]): KpiTrendResult {
    if (measurements.length === 0) {
      return this.insufficientData(definition, 'No measurements available');
    }

    const sorted = [...measurements].sort((a, b) => b.measuredAt - a.measuredAt);
    const latest = sorted[0];
    const currentValue = latest.value;

    if (sorted.length < 2) {
      return {
        definitionId: definition.id,
        productId: latest.productId,
        direction: 'insufficient_data',
        currentValue,
        previousValue: null,
        changePercent: null,
        confidence: this.computeConfidence(sorted),
        period: { start: sorted[sorted.length - 1].measuredAt, end: latest.measuredAt },
        rationale: ['Only one measurement available — insufficient for trend'],
      };
    }

    const previous = sorted[1];
    const previousValue = previous.value;
    const changePercent = previousValue !== 0 ? (currentValue - previousValue) / Math.abs(previousValue) : 0;

    const direction = this.determineDirection(definition, currentValue, previousValue, changePercent);
    const confidence = this.computeConfidence(sorted);
    const rationale = this.buildRationale(definition, direction, currentValue, previousValue, changePercent);

    return {
      definitionId: definition.id,
      productId: latest.productId,
      direction,
      currentValue,
      previousValue,
      changePercent: Math.round(changePercent * 10000) / 100,
      confidence,
      period: { start: sorted[sorted.length - 1].measuredAt, end: latest.measuredAt },
      rationale,
    };
  }

  calculateAllTrends(
    definitions: KpiDefinition[],
    measurements: KpiMeasurement[]
  ): Map<string, KpiTrendResult> {
    const results = new Map<string, KpiTrendResult>();
    for (const def of definitions) {
      for (const productId of this.uniqueProducts(measurements)) {
        const productMeasurements = measurements.filter(
          m => m.definitionId === def.id && m.productId === productId
        );
        if (productMeasurements.length > 0) {
          const result = this.calculateTrend(def, productMeasurements);
          results.set(`${def.id}:${productId}`, result);
        }
      }
    }
    return results;
  }

  computeConfidence(sorted: KpiMeasurement[]): number {
    if (sorted.length === 0) return 0;

    const now = Date.now();
    const freshnessScores = sorted.map(m => {
      const age = now - m.measuredAt;
      if (age <= 0) return 1.0;
      return Math.max(0, 1 - age / MAX_MEASUREMENT_AGE_MS);
    });

    const avgFreshness = freshnessScores.reduce((a, b) => a + b, 0) / freshnessScores.length;
    const countFactor = Math.min(sorted.length / 5, 1);
    const avgEvidenceConfidence = sorted.reduce((a, m) => a + m.confidence, 0) / sorted.length;

    return Math.round((avgFreshness * 0.3 + countFactor * 0.3 + avgEvidenceConfidence * 0.4) * 100) / 100;
  }

  private determineDirection(
    definition: KpiDefinition,
    current: number,
    previous: number,
    changePercent: number
  ): KpiTrendDirection {
    if (Math.abs(changePercent) < TREND_STABILITY_THRESHOLD) return 'stable';

    const increasing = current > previous;

    switch (definition.targetType) {
      case 'higher_is_better':
        return increasing ? 'improving' : 'declining';
      case 'lower_is_better':
        return increasing ? 'declining' : 'improving';
      case 'target_value': {
        if (definition.targetValue === undefined) return 'stable';
        const prevDist = Math.abs(previous - definition.targetValue);
        const currDist = Math.abs(current - definition.targetValue);
        return currDist < prevDist ? 'improving' : 'declining';
      }
    }
  }

  private buildRationale(
    definition: KpiDefinition,
    direction: KpiTrendDirection,
    current: number,
    previous: number,
    changePercent: number
  ): string[] {
    const parts: string[] = [];
    parts.push(`${definition.name}: ${current} ${definition.unit} (was ${previous} ${definition.unit})`);
    parts.push(`Change: ${(changePercent * 100).toFixed(1)}%`);
    parts.push(`Trend: ${direction} (target type: ${definition.targetType})`);
    if (definition.targetValue !== undefined) {
      parts.push(`Target: ${definition.targetValue} ${definition.unit}`);
    }
    return parts;
  }

  private insufficientData(definition: KpiDefinition, reason: string): KpiTrendResult {
    return {
      definitionId: definition.id,
      productId: '',
      direction: 'insufficient_data',
      currentValue: null,
      previousValue: null,
      changePercent: null,
      confidence: 0,
      period: { start: 0, end: 0 },
      rationale: [reason],
    };
  }

  private uniqueProducts(measurements: KpiMeasurement[]): string[] {
    return [...new Set(measurements.map(m => m.productId))];
  }
}
