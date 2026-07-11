import { GammaReaderBase } from "../platform/gamma-reader-base";
import type { GitHubResource } from "../connectors/github/resource-parser";

export class GitHubReader extends GammaReaderBase<GitHubResource> {
  getByName(name: string, _currentTime: Date): GitHubResource | undefined {
    return this.find((resource) => resource.name === name);
  }

  getByType(resourceType: GitHubResource["resourceType"]): GitHubResource[] {
    return this.filter((resource) => resource.resourceType === resourceType);
  }

  getRecent(currentTime: Date, limitDays = 7): GitHubResource[] {
    const cutoff = new Date(currentTime.getTime() - limitDays * 24 * 60 * 60 * 1000);
    return this.since((resource) => resource.createdAt, cutoff);
  }

  getSummary(currentTime: Date): {
    total: number;
    recent: number;
    repositories: number;
    issues: number;
    lastUpdated: Date | null;
  } {
    const all = this.all();
    const latest = this.latest((resource) => resource.createdAt);
    return {
      total: all.length,
      recent: this.getRecent(currentTime).length,
      repositories: all.filter((resource) => resource.resourceType === "repository").length,
      issues: all.filter((resource) => resource.resourceType === "issue").length,
      lastUpdated: latest ? new Date(latest.createdAt) : null,
    };
  }
}
