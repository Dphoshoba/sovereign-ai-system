import type { GammaTemplateItem } from "./types"

export const GAMMA_TEMPLATES: ReadonlyArray<GammaTemplateItem> = [
  { slug: "research-template", title: "Research Template", category: "research", filePath: "gamma/templates/research-template.md" },
  { slug: "creator-template", title: "Creator Template", category: "creator", filePath: "gamma/templates/creator-template.md" },
  { slug: "ministry-template", title: "Ministry Template", category: "ministry", filePath: "gamma/templates/ministry-template.md" },
  { slug: "executive-template", title: "Executive Template", category: "executive", filePath: "gamma/templates/executive-template.md" },
  { slug: "agency-template", title: "Agency Template", category: "agency", filePath: "gamma/templates/agency-template.md" },
  { slug: "shared-template", title: "Shared Template", category: "shared", filePath: "gamma/templates/shared-template.md" },
]
