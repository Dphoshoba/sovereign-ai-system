import type { ContentAsset, ContentCampaign, ContentLineage } from "./content-campaign"

export type ContentLineageValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
  lineageComplete: boolean
}

export function buildContentLineagePath(asset: ContentAsset) {
  return [
    {
      layer: "Research Mission",
      ids: [asset.lineage.researchMissionId],
    },
    {
      layer: "Evidence",
      ids: asset.lineage.evidenceIds,
    },
    {
      layer: "Consensus",
      ids: asset.lineage.consensusIds,
    },
    {
      layer: "Ontology",
      ids: asset.lineage.ontologyRecordIds,
    },
    {
      layer: "Review Package",
      ids: asset.lineage.reviewPackageIds,
    },
    {
      layer: "Master Brief",
      ids: asset.lineage.masterBriefId ? [asset.lineage.masterBriefId] : [],
    },
    {
      layer: "Generated Asset",
      ids: [asset.id],
    },
  ]
}

export function validateContentLineage(
  lineage: ContentLineage
): ContentLineageValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!lineage.researchMissionId.trim()) errors.push("researchMissionId is required.")
  if (lineage.evidenceIds.length === 0) errors.push("At least one evidence id is required.")
  if (lineage.consensusIds.length === 0) warnings.push("Consensus id is recommended before generation.")
  if (lineage.ontologyRecordIds.length === 0) warnings.push("Ontology record id is recommended before generation.")
  if (lineage.reviewPackageIds.length === 0) errors.push("Review package id is required.")

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    lineageComplete:
      errors.length === 0 &&
      lineage.consensusIds.length > 0 &&
      lineage.ontologyRecordIds.length > 0,
  }
}

export function summarizeCampaignLineage(campaign: ContentCampaign) {
  const validations = campaign.assets.map((asset) => ({
    assetId: asset.id,
    assetType: asset.type,
    validation: validateContentLineage(asset.lineage),
  }))

  return {
    campaignId: campaign.id,
    assets: validations.length,
    complete: validations.filter((item) => item.validation.lineageComplete).length,
    invalid: validations.filter((item) => !item.validation.valid).length,
    validations,
  }
}
