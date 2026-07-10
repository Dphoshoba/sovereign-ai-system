/**
 * Echo Reader (GAMMA)
 *
 * Deterministic read-only queries for echo data.
 * All time-dependent methods accept currentTime parameter.
 * Extends GammaReaderBase — no store/retrieve boilerplate needed.
 */

import { GammaReaderBase } from '../platform/gamma-reader-base';
import type { EchoResource } from '../connectors/echo/resource-parser';

export class EchoReader extends GammaReaderBase<EchoResource> {
  /**
   * Get by name (deterministic)
   */
  getByName(name: string, currentTime: Date): EchoResource | undefined {
    return this.find(r => r.name === name);
  }

  /**
   * Get recent resources (deterministic — uses currentTime)
   */
  getRecent(currentTime: Date, limitDays = 7): EchoResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since(r => r.createdAt, cutoff);
  }

  /**
   * Get summary (deterministic)
   */
  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const recent = this.getRecent(currentTime);
    const latest = this.latest(r => r.createdAt);
    return {
      total: all.length,
      recent: recent.length,
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
