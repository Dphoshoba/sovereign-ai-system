/**
 * Platform SDK Tests
 *
 * Tests for all platform shared utilities.
 * All tests are deterministic — no Date.now(), no Math.random().
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GammaReaderBase } from '../../lib/platform/gamma-reader-base';
import {
  scoreToHealth,
  scoreToColorClass,
  scoreToTextClass,
  scoreToBadgeClass,
  scoreToBorderClass,
  severityToColorClass,
  averageScore,
  weightedScore,
  isProductionReady,
  healthSummary,
} from '../../lib/platform/health-helpers';
import {
  PLATFORM_BASE_TIME,
  GMAIL_HARDENING_BASE_TIME,
  GMAIL_CERT_BASE_TIME,
  offsetFrom,
  relativeToBase,
  relativeToBaseISO,
  TIME_OFFSETS,
  minutesUntil,
  daysUntil,
} from '../../lib/platform/mock-time-helpers';
import {
  PLATFORM_VERSION,
  PLATFORM_TAG,
  PLATFORM_BILL_OF_MATERIALS,
} from '../../lib/platform/connector-platform-sdk';

// ─── GammaReaderBase Tests ────────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
  score: number;
  createdAt: Date;
}

class TestReader extends GammaReaderBase<TestItem> {
  getByName(name: string): TestItem | undefined {
    return this.find(i => i.name === name);
  }

  getHighScores(threshold: number): TestItem[] {
    return this.filter(i => i.score >= threshold);
  }

  sortedByScore(): TestItem[] {
    return this.sortBy(i => i.score, 'desc');
  }

  recent(currentTime: Date, days = 7): TestItem[] {
    const cutoff = new Date(currentTime.getTime() - days * 24 * 60 * 60 * 1000);
    return this.since(i => i.createdAt, cutoff);
  }
}

const BASE = PLATFORM_BASE_TIME;
const ITEM_A: TestItem = { id: 'a', name: 'Alpha', score: 95, createdAt: BASE };
const ITEM_B: TestItem = { id: 'b', name: 'Beta', score: 72, createdAt: new Date(BASE.getTime() - 3 * 24 * 60 * 60 * 1000) };
const ITEM_C: TestItem = { id: 'c', name: 'Gamma', score: 45, createdAt: new Date(BASE.getTime() - 10 * 24 * 60 * 60 * 1000) };

describe('GammaReaderBase', () => {
  let reader: TestReader;

  beforeEach(() => {
    reader = new TestReader();
  });

  describe('Core CRUD', () => {
    it('should start empty', () => {
      expect(reader.count()).toBe(0);
      expect(reader.all()).toHaveLength(0);
    });

    it('should store and retrieve by id', () => {
      reader.set('a', ITEM_A);
      expect(reader.get('a')).toEqual(ITEM_A);
    });

    it('should return undefined for missing id', () => {
      expect(reader.get('nonexistent')).toBeUndefined();
    });

    it('should check existence with has()', () => {
      reader.set('a', ITEM_A);
      expect(reader.has('a')).toBe(true);
      expect(reader.has('b')).toBe(false);
    });

    it('should remove items', () => {
      reader.set('a', ITEM_A);
      reader.remove('a');
      expect(reader.has('a')).toBe(false);
      expect(reader.count()).toBe(0);
    });

    it('should overwrite existing item', () => {
      reader.set('a', ITEM_A);
      const updated = { ...ITEM_A, score: 88 };
      reader.set('a', updated);
      expect(reader.get('a')?.score).toBe(88);
    });

    it('should count correctly', () => {
      reader.set('a', ITEM_A);
      reader.set('b', ITEM_B);
      expect(reader.count()).toBe(2);
    });

    it('should return all items', () => {
      reader.set('a', ITEM_A);
      reader.set('b', ITEM_B);
      reader.set('c', ITEM_C);
      expect(reader.all()).toHaveLength(3);
    });

    it('should clear all items', () => {
      reader.set('a', ITEM_A);
      reader.set('b', ITEM_B);
      reader.clear();
      expect(reader.count()).toBe(0);
    });
  });

  describe('Query Methods', () => {
    beforeEach(() => {
      reader.set('a', ITEM_A);
      reader.set('b', ITEM_B);
      reader.set('c', ITEM_C);
    });

    it('should filter items', () => {
      const high = reader.filter(i => i.score >= 90);
      expect(high).toHaveLength(1);
      expect(high[0].id).toBe('a');
    });

    it('should find first match', () => {
      const found = reader.find(i => i.name === 'Beta');
      expect(found?.id).toBe('b');
    });

    it('should return undefined when find has no match', () => {
      expect(reader.find(i => i.name === 'Nonexistent')).toBeUndefined();
    });

    it('should sort ascending', () => {
      const sorted = reader.sortBy(i => i.score);
      expect(sorted[0].score).toBe(45);
      expect(sorted[2].score).toBe(95);
    });

    it('should sort descending', () => {
      const sorted = reader.sortBy(i => i.score, 'desc');
      expect(sorted[0].score).toBe(95);
      expect(sorted[2].score).toBe(45);
    });

    it('should group by field', () => {
      const grouped = reader.groupBy(i => i.score >= 70 ? 'passing' : 'failing');
      expect(grouped['passing']).toHaveLength(2);
      expect(grouped['failing']).toHaveLength(1);
    });

    it('should find latest by date', () => {
      const latest = reader.latest(i => i.createdAt);
      expect(latest?.id).toBe('a'); // BASE_TIME is most recent
    });
  });

  describe('Time-based Queries (Deterministic)', () => {
    beforeEach(() => {
      reader.set('a', ITEM_A); // at BASE
      reader.set('b', ITEM_B); // 3 days before BASE
      reader.set('c', ITEM_C); // 10 days before BASE
    });

    it('should get items since a cutoff (deterministic)', () => {
      const cutoff = new Date(BASE.getTime() - 5 * 24 * 60 * 60 * 1000);
      const recent = reader.since(i => i.createdAt, cutoff);
      expect(recent).toHaveLength(2); // a and b
    });

    it('should get items before a cutoff (deterministic)', () => {
      const cutoff = new Date(BASE.getTime() - 5 * 24 * 60 * 60 * 1000);
      const old = reader.before(i => i.createdAt, cutoff);
      expect(old).toHaveLength(1); // only c
    });

    it('should return same result for same currentTime (deterministic)', () => {
      const r1 = reader.recent(BASE, 7);
      const r2 = reader.recent(BASE, 7);
      expect(r1).toEqual(r2);
    });
  });

  describe('Custom Reader Methods', () => {
    beforeEach(() => {
      reader.set('a', ITEM_A);
      reader.set('b', ITEM_B);
    });

    it('should find by name', () => {
      const found = reader.getByName('Alpha');
      expect(found?.id).toBe('a');
    });

    it('should get high scores', () => {
      const high = reader.getHighScores(80);
      expect(high).toHaveLength(1);
      expect(high[0].id).toBe('a');
    });

    it('should sort by score descending', () => {
      reader.set('c', ITEM_C);
      const sorted = reader.sortedByScore();
      expect(sorted[0].id).toBe('a');
      expect(sorted[sorted.length - 1].id).toBe('c');
    });
  });
});

// ─── Health Helpers Tests ──────────────────────────────────────────────────────

describe('Health Helpers', () => {
  describe('scoreToHealth()', () => {
    it('should classify 90+ as healthy', () => {
      const h = scoreToHealth(95);
      expect(h.status).toBe('healthy');
      expect(h.label).toBe('Healthy');
    });

    it('should classify 90 as healthy (boundary)', () => {
      expect(scoreToHealth(90).status).toBe('healthy');
    });

    it('should classify 70-89 as degraded', () => {
      expect(scoreToHealth(80).status).toBe('degraded');
      expect(scoreToHealth(70).status).toBe('degraded');
    });

    it('should classify 89 as degraded (boundary)', () => {
      expect(scoreToHealth(89).status).toBe('degraded');
    });

    it('should classify below 70 as critical', () => {
      expect(scoreToHealth(69).status).toBe('critical');
      expect(scoreToHealth(0).status).toBe('critical');
    });

    it('should use custom recommendations', () => {
      const h = scoreToHealth(95, { healthy: 'All good!' });
      expect(h.recommendation).toBe('All good!');
    });

    it('should include score in result', () => {
      expect(scoreToHealth(82).score).toBe(82);
    });
  });

  describe('scoreToColorClass()', () => {
    it('should return green for 90+', () => {
      expect(scoreToColorClass(95)).toBe('bg-green-500');
      expect(scoreToColorClass(90)).toBe('bg-green-500');
    });

    it('should return yellow for 70-89', () => {
      expect(scoreToColorClass(80)).toBe('bg-yellow-500');
      expect(scoreToColorClass(70)).toBe('bg-yellow-500');
    });

    it('should return red for below 70', () => {
      expect(scoreToColorClass(69)).toBe('bg-red-500');
      expect(scoreToColorClass(0)).toBe('bg-red-500');
    });
  });

  describe('scoreToTextClass()', () => {
    it('should return green text for 90+', () => {
      expect(scoreToTextClass(95)).toContain('green');
    });

    it('should return yellow text for 70-89', () => {
      expect(scoreToTextClass(75)).toContain('yellow');
    });

    it('should return red text for below 70', () => {
      expect(scoreToTextClass(50)).toContain('red');
    });
  });

  describe('scoreToBadgeClass()', () => {
    it('should return green badge for healthy score', () => {
      expect(scoreToBadgeClass(95)).toContain('green');
    });

    it('should return red badge for critical score', () => {
      expect(scoreToBadgeClass(40)).toContain('red');
    });
  });

  describe('scoreToBorderClass()', () => {
    it('should return green border for healthy score', () => {
      expect(scoreToBorderClass(95)).toContain('green');
    });
  });

  describe('severityToColorClass()', () => {
    it('should return red for critical', () => {
      expect(severityToColorClass('critical')).toContain('red');
    });

    it('should return orange for high', () => {
      expect(severityToColorClass('high')).toContain('orange');
    });

    it('should return yellow for medium', () => {
      expect(severityToColorClass('medium')).toContain('yellow');
    });

    it('should return blue for low', () => {
      expect(severityToColorClass('low')).toContain('blue');
    });
  });

  describe('averageScore()', () => {
    it('should compute average', () => {
      expect(averageScore([80, 90, 70])).toBe(80);
    });

    it('should handle empty array', () => {
      expect(averageScore([])).toBe(0);
    });

    it('should round to integer', () => {
      expect(averageScore([80, 81])).toBe(81);
    });
  });

  describe('weightedScore()', () => {
    it('should compute weighted average', () => {
      const result = weightedScore([
        { score: 100, weight: 0.5 },
        { score: 60, weight: 0.5 },
      ]);
      expect(result).toBe(80);
    });

    it('should handle empty array', () => {
      expect(weightedScore([])).toBe(0);
    });
  });

  describe('isProductionReady()', () => {
    it('should return true for 70+', () => {
      expect(isProductionReady(70)).toBe(true);
      expect(isProductionReady(100)).toBe(true);
    });

    it('should return false below 70', () => {
      expect(isProductionReady(69)).toBe(false);
      expect(isProductionReady(0)).toBe(false);
    });
  });

  describe('healthSummary()', () => {
    it('should describe healthy score', () => {
      expect(healthSummary(95)).toContain('Healthy');
    });

    it('should describe degraded score', () => {
      expect(healthSummary(75)).toContain('Degraded');
    });

    it('should describe critical score', () => {
      expect(healthSummary(55)).toContain('Critical');
    });

    it('should describe failing score', () => {
      expect(healthSummary(30)).toContain('Failing');
    });
  });
});

// ─── Mock Time Helpers Tests ───────────────────────────────────────────────────

describe('Mock Time Helpers', () => {
  describe('Constants', () => {
    it('PLATFORM_BASE_TIME should be a valid date', () => {
      expect(PLATFORM_BASE_TIME).toBeInstanceOf(Date);
      expect(PLATFORM_BASE_TIME.getFullYear()).toBe(2026);
    });

    it('GMAIL_HARDENING_BASE_TIME should be July 2026', () => {
      expect(GMAIL_HARDENING_BASE_TIME.getMonth()).toBe(6); // July (0-indexed)
    });

    it('GMAIL_CERT_BASE_TIME should be July 10 2026', () => {
      expect(GMAIL_CERT_BASE_TIME.getDate()).toBe(10);
    });

    it('should not use current system time', () => {
      // Verify constants are fixed, not derived from Date.now()
      expect(PLATFORM_BASE_TIME.getTime()).toBe(new Date('2026-07-01T00:00:00.000Z').getTime());
    });
  });

  describe('offsetFrom()', () => {
    it('should add positive offset', () => {
      const result = offsetFrom(BASE, 1000);
      expect(result.getTime()).toBe(BASE.getTime() + 1000);
    });

    it('should subtract negative offset', () => {
      const result = offsetFrom(BASE, -1000);
      expect(result.getTime()).toBe(BASE.getTime() - 1000);
    });

    it('should handle zero offset', () => {
      const result = offsetFrom(BASE, 0);
      expect(result.getTime()).toBe(BASE.getTime());
    });
  });

  describe('relativeToBase()', () => {
    it('should compute time relative to PLATFORM_BASE_TIME', () => {
      const oneDay = relativeToBase(TIME_OFFSETS.oneDayMs);
      expect(oneDay.getTime()).toBe(PLATFORM_BASE_TIME.getTime() + TIME_OFFSETS.oneDayMs);
    });

    it('should produce consistent ISO strings', () => {
      const iso1 = relativeToBaseISO(0);
      const iso2 = relativeToBaseISO(0);
      expect(iso1).toBe(iso2);
    });
  });

  describe('TIME_OFFSETS', () => {
    it('should have correct minute value', () => {
      expect(TIME_OFFSETS.oneMinuteMs).toBe(60 * 1000);
    });

    it('should have correct hour value', () => {
      expect(TIME_OFFSETS.oneHourMs).toBe(60 * 60 * 1000);
    });

    it('should have correct day value', () => {
      expect(TIME_OFFSETS.oneDayMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should have correct week value', () => {
      expect(TIME_OFFSETS.oneWeekMs).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('minutesUntil()', () => {
    it('should compute positive minutes until future date', () => {
      const future = new Date(BASE.getTime() + 30 * 60 * 1000);
      expect(minutesUntil(future, BASE)).toBe(30);
    });

    it('should return null for past date', () => {
      const past = new Date(BASE.getTime() - 1000);
      expect(minutesUntil(past, BASE)).toBeNull();
    });
  });

  describe('daysUntil()', () => {
    it('should compute days until future date', () => {
      const future = new Date(BASE.getTime() + 5 * TIME_OFFSETS.oneDayMs);
      expect(daysUntil(future, BASE)).toBe(5);
    });

    it('should return null for past date', () => {
      const past = new Date(BASE.getTime() - TIME_OFFSETS.oneDayMs);
      expect(daysUntil(past, BASE)).toBeNull();
    });
  });
});

// ─── Platform SDK Constants Tests ─────────────────────────────────────────────

describe('Platform SDK Constants', () => {
  it('should have correct version', () => {
    expect(PLATFORM_VERSION).toBe('1.0.0');
  });

  it('should have correct tag', () => {
    expect(PLATFORM_TAG).toBe('gamma-connector-platform-v1');
  });

  it('should have shared components', () => {
    expect(PLATFORM_BILL_OF_MATERIALS.shared.length).toBeGreaterThan(5);
  });

  it('should have adapters list', () => {
    expect(PLATFORM_BILL_OF_MATERIALS.adapters).toContain('OAuthAdapter');
    expect(PLATFORM_BILL_OF_MATERIALS.adapters).toContain('ApiClient');
    expect(PLATFORM_BILL_OF_MATERIALS.adapters).toContain('ResourceParser');
    expect(PLATFORM_BILL_OF_MATERIALS.adapters).toContain('ActionSet');
  });

  it('should have pattern components', () => {
    expect(PLATFORM_BILL_OF_MATERIALS.patterns).toContain('health-checker');
    expect(PLATFORM_BILL_OF_MATERIALS.patterns).toContain('certification-runner');
  });
});
