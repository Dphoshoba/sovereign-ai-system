# EV-KOS Phase 6B - Draft Generation Contracts

## Status

Phase 6B is implemented as a preview-only draft generation contract layer. It
does not generate, save, approve, publish, post, or call OpenAI.

## Goal

This phase prepares governed content generation by defining the exact contract
each campaign asset must satisfy before a future generation phase can be
considered.

## Files

- `lib/content/draft-generation-contracts.ts`
- `lib/content/asset-prompt-contracts.ts`
- `lib/content/draft-readiness.ts`
- `app/api/content/draft-contracts/route.ts`

## Supported Asset Types

- `article`
- `newsletter`
- `linkedin`
- `x-twitter`
- `threads`
- `facebook`
- `youtube-script`
- `shorts-script`
- `podcast-outline`
- `presentation-outline`
- `lead-magnet`
- `email-campaign`

## Contract Shape

Each contract includes:

- `assetType`
- `sourceMissionId`
- `campaignId`
- `requiredInputs`
- `optionalInputs`
- `promptPurpose`
- `toneGuidelines`
- `citationRequirements`
- `reviewRequirements`
- `approvalRequirements`
- `outputSchema`
- `riskFlags`
- `lineageRequirements`
- `generationExecuted: false`
- `publishingExecuted: false`
- `writesToPrisma: false`

## Readiness Statuses

Draft readiness returns one of:

- `READY_FOR_DRAFT_PREVIEW`
- `MISSING_REQUIRED_INPUTS`
- `REVIEW_REQUIRED`
- `BLOCKED`

The default example returns `REVIEW_REQUIRED` because all preview inputs are
present, but human review is still mandatory before any generated draft can be
used.

## API Route

Route:

```text
GET /api/content/draft-contracts
```

The route is GET-only and preview-only.

It returns:

- `writesToPrisma: false`
- `generationExecuted: false`
- `publishingExecuted: false`
- `socialPostingExecuted: false`
- `automaticApprovals: false`
- `openAiCalls: false`

## Hard Boundaries

This phase does not:

- call OpenAI
- generate real draft content
- persist drafts
- write to the database
- change Prisma schema
- create migrations
- publish content
- post to social channels
- approve automatically
- change Phase 3 research behavior

## Phase 6C Recommendation

Phase 6C should add preview-only draft assembly stubs that consume these
contracts and return non-persistent placeholder previews, still with:

- no OpenAI calls unless separately approved
- no database writes
- no publishing
- no social posting
- no automatic approvals
