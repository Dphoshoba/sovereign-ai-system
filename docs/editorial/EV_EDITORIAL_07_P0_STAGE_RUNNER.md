# EV-EDITORIAL-07-P0 — Unified Editorial Stage Runner

**Director decision:** GO — P0 implementation only  
**Boundary:** Local implementation, tests, documentation, local commit. No Production deploy, DB migration, approval, schedule, publish, or social.

## Execution contract

`POST /api/articles/editorial-stage-runner` (editor auth required)

Body (one of):

- `{ "articleId": "<existing draft|review|review-required id>" }`
- `{ "title": "...", "category": "ai-tools", "excerpt": "...", "content": "..." }`

Flow: **Draft → Research/Audit (`prepareArticleForReview`) → stop at `review-required`**

Outcomes:

| outcome | meaning |
| --- | --- |
| `ready_for_human_review` | Current prepare produced publish-ready audit; status `review-required` |
| `hold` | Incomplete content/evidence or non-publish-ready audit; HOLD note recorded |
| `already_applied` | Duplicate prepare / already at review-required |
| `failed` | Hard failure; article unchanged when possible |

Never calls: approve, schedule, publish, social, featured-image generation.

## Legacy lockdown

- `POST /api/pipeline/auto-schedule` → HTTP 410 `LEGACY_AUTO_SCHEDULE_DISABLED`
- `POST /api/pipeline` packages without calling auto-schedule
- `POST /api/articles/schedule` and cron publish-due remain for authorised post-approval use
