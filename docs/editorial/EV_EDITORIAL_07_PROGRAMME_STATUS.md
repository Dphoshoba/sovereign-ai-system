# EV-EDITORIAL-07 — Programme status (engineering)

**Branch:** `cursor/ev-editorial-07-p0u`  
**Production:** NOT authorised in this programme

## Milestone status

| ID | Milestone | Status |
| --- | --- | --- |
| P0 | Stage runner + lockdown | Done |
| P0U | Director prepare UI | Done + validated in suite |
| P1 | Bounded evidence recovery | Done |
| P2 | Post-approval featured image | Done |
| P3 | Director Decision Board | Done |
| P4 | Publishing calendar policy | Done |
| P5 | Social ops monitoring helpers | Done (dual gate preserved) |

## Director workflow (engineered)

1. `/admin/ai-generator` → Prepare for Director Review  
2. Platform draft + stage runner → review-ready or HOLD  
3. `/admin/director-board` → review / approve / reject / retry  
4. Approve triggers post-approval image prep + optional calendar slot (guards remain)  
5. Cron publish-due publishes when due  
6. Social drafts remain separately approved at `/admin/social`  
7. `/admin/director-checklist` monitors evidence-derived statuses  

## Explicitly incomplete without Preview

- Live Preview end-to-end with authenticated editor session  
- Live OpenAI image generation in Preview  
- Production readiness (separate GO)
