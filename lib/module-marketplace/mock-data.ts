import type { ModuleMarketplaceWorkspace } from "./types"

export const MODULE_MARKETPLACE_ASSETS: ModuleMarketplaceWorkspace = {
  modules: [
    {
      id: "mod-001",
      name: "Ministry Pack",
      pack: "ministry",
      version: "2.1.0",
      status: "available",
      description: "Complete ministry management with sermons, discipleship, and outreach tools",
      downloads: 4820,
    },
    {
      id: "mod-002",
      name: "Business Pack",
      pack: "business",
      version: "1.8.3",
      status: "available",
      description: "Business intelligence, CRM, project tracking, and revenue analytics",
      downloads: 6340,
    },
    {
      id: "mod-003",
      name: "School Pack",
      pack: "school",
      version: "1.5.0",
      status: "available",
      description: "Curriculum management, student tracking, and learning analytics",
      downloads: 2190,
    },
    {
      id: "mod-004",
      name: "Research Pack",
      pack: "research",
      version: "3.0.1",
      status: "installed",
      description: "Literature review, citation management, and research pipeline tools",
      downloads: 8750,
    },
    {
      id: "mod-005",
      name: "Creator Pack",
      pack: "creator",
      version: "2.4.2",
      status: "available",
      description: "Content creation, publishing workflow, and audience analytics",
      downloads: 11200,
    },
  ],
  metrics: {
    totalModules: 5,
    installedModules: 1,
    totalDownloads: 33300,
    healthScore: 95,
  },
}
