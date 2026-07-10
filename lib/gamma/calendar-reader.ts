/**
 * Calendar Reader (GAMMA)
 */
import { GammaReaderBase } from '../platform/gamma-reader-base';
import type { CalendarResource } from '../connectors/calendar/resource-parser';

export class CalendarReader extends GammaReaderBase<CalendarResource> {
  getByName(name: string, currentTime: Date): CalendarResource | undefined {
    return this.find(r => r.name === name);
  }

  getRecent(currentTime: Date, limitDays = 7): CalendarResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since(r => r.createdAt, cutoff);
  }

  getSummary(currentTime: Date) {
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
