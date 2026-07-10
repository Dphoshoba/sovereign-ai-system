/**
 * Gamma Reader Base
 *
 * Abstract base class for all GAMMA readers.
 * Eliminates the Map-based store/retrieve/filter boilerplate
 * duplicated across 131 reader files.
 *
 * Usage:
 *   class MyReader extends GammaReaderBase<MyType> {
 *     getByStatus(status: string, currentTime: Date) {
 *       return this.filter(item => item.status === status);
 *     }
 *   }
 */

export abstract class GammaReaderBase<T extends { id?: string }> {
  protected store = new Map<string, T>();

  /**
   * Store an item by ID
   */
  set(id: string, item: T): void {
    this.store.set(id, item);
  }

  /**
   * Retrieve an item by ID
   */
  get(id: string): T | undefined {
    return this.store.get(id);
  }

  /**
   * Check existence
   */
  has(id: string): boolean {
    return this.store.has(id);
  }

  /**
   * Remove an item
   */
  remove(id: string): void {
    this.store.delete(id);
  }

  /**
   * Get all items as array
   */
  all(): T[] {
    return Array.from(this.store.values());
  }

  /**
   * Get count
   */
  count(): number {
    return this.store.size;
  }

  /**
   * Filter items (deterministic — does not use Date.now())
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.all().filter(predicate);
  }

  /**
   * Find first matching item
   */
  find(predicate: (item: T) => boolean): T | undefined {
    return this.all().find(predicate);
  }

  /**
   * Sort items (deterministic — caller provides sort key)
   */
  sortBy<K>(keyFn: (item: T) => K, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...this.all()].sort((a, b) => {
      const ka = keyFn(a);
      const kb = keyFn(b);
      if (ka < kb) return direction === 'asc' ? -1 : 1;
      if (ka > kb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Group items by a key
   */
  groupBy<K extends string>(keyFn: (item: T) => K): Record<K, T[]> {
    const groups = {} as Record<K, T[]>;
    for (const item of this.all()) {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }

  /**
   * Get latest item by date field (deterministic)
   */
  latest(dateFn: (item: T) => Date | string): T | undefined {
    const items = this.all();
    if (items.length === 0) return undefined;
    return items.reduce((best, item) => {
      const bestDate = new Date(dateFn(best));
      const itemDate = new Date(dateFn(item));
      return itemDate > bestDate ? item : best;
    });
  }

  /**
   * Get items created after a given time (deterministic — accepts currentTime)
   */
  since(dateFn: (item: T) => Date | string, cutoff: Date): T[] {
    return this.filter((item) => new Date(dateFn(item)) >= cutoff);
  }

  /**
   * Get items created before a given time (deterministic — accepts currentTime)
   */
  before(dateFn: (item: T) => Date | string, cutoff: Date): T[] {
    return this.filter((item) => new Date(dateFn(item)) < cutoff);
  }

  /**
   * Compute a summary (deterministic — accepts currentTime)
   */
  summary(currentTime: Date): {
    total: number;
    ids: string[];
    oldestDate: Date | null;
    newestDate: Date | null;
  } {
    const ids = Array.from(this.store.keys());
    return {
      total: this.store.size,
      ids,
      oldestDate: null,
      newestDate: null,
    };
  }

  /**
   * Clear all data (use with care — primarily for testing)
   */
  clear(): void {
    this.store.clear();
  }
}
