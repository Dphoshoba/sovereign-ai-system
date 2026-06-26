# EV-KOS Phase 6C - Governed Draft Preview Engine

## Status

Phase 6C adds the governed draft preview layer. It assembles draft preview
packets from an approved research mission, campaign, master brief, lineage, and
Phase 6B prompt contracts.

This phase does not generate content, call OpenAI, write to Prisma, publish,
post to social channels, or approve anything automatically.

## Files

- `lib/content/draft-preview-engine.ts`
- `lib/content/draft-preview-packet.ts`
- `lib/content/campaign-preview.ts`
- `app/api/content/draft-preview/route.ts`
- `app/api/content/campaign-preview/route.ts`

## Flow

```text
Approved Research Mission
  -> Master Brief
  -> Content Campaign
  -> Draft Generation Contracts
  -> Draft Preview Packets
  -> Campaign Preview Dashboard
```

## Draft Preview Packet Shape

Each packet includes:

- `assetType`
- `campaignId`
- `missionId`
- `masterBriefReference`
- `promptContractReference`
- `requiredInputs`
- `verifiedClaims`
- `citations`
- `lineage`
- `readinessStatus`
- `reviewRequirements`
- `approvalRequirements`
- `estimatedPromptSize`
- `validationChecklist`

The packet also carries explicit safety fields:

- `generatedText: null`
- `generationExecuted: false`
- `writesToPrisma: false`
- `publishingExecuted: false`
- `socialPostingExecuted: false`
- `automaticApprovals: false`

## Validation Outcomes

Preview validation returns one of:

- `READY_FOR_GENERATION`
- `REVIEW_REQUIRED`
- `BLOCKED`

The current example returns `REVIEW_REQUIRED` because the packets are
structurally complete but human review and approval remain mandatory before any
future generation engine may run.

## Validation Checks

Each packet validates:

- mission exists
- master brief exists
- prompt contract exists
- citation requirements are satisfied
- lineage is complete
- governance remains intact
- review package is available

## Campaign Preview

The campaign preview returns:

- total assets
- ready assets
- blocked assets
- review-required assets
- missing requirements
- dependency graph
- review queue summary
- approval summary
- readiness score

## Routes

```text
GET /api/content/draft-preview
GET /api/content/campaign-preview
```

Both routes are read-only and preview-only.

They return:

- `writesToPrisma: false`
- `generationExecuted: false`
- `generatedContent: false`
- `publishingExecuted: false`
- `socialPostingExecuted: false`
- `automaticApprovals: false`
- `openAiCalls: false`

## Hard Boundaries

Phase 6C must not:

- call OpenAI
- generate text
- save drafts
- write to Prisma
- change schema
- create migrations
- publish
- post to social platforms
- approve automatically
- weaken existing governance gates

## Remaining Blockers Before Real AI Draft Generation

- a governed generation executor must be created
- explicit operator approval must be required
- prompt packet review must be persisted or mapped to an existing approval queue
- generated draft persistence must be designed separately
- citation checking must run after generation and before approval
- publication and social posting must remain separate downstream approvals
