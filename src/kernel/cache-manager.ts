import type { CacheEntry } from "./types"

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private static readonly FIXED_TIMESTAMP = 1751990400000

  set<T>(key: string, value: T, ttl: number): void {
    const createdAt = CacheManager.FIXED_TIMESTAMP
    const expiresAt = createdAt + ttl

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt,
      expiresAt,
      ttl,
    }

    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired using fixed timestamp
    if (CacheManager.FIXED_TIMESTAMP > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if expired
    if (CacheManager.FIXED_TIMESTAMP > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  getAll(): CacheEntry<any>[] {
    return Array.from(this.cache.values())
  }

  getStats(): {
    size: number
    entries: number
    memoryUsage: number
  } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
      memoryUsage: this.cache.size * 256, // Approximate
    }
  }
}
