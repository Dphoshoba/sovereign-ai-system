# EV-EDITORIAL-01 — Director Review Pack

**Status:** Three articles prepared in Production human-review queue (`review-required`)  
**Date:** 2026-11-22 (Australia/Adelaide)  
**Environment:** Production application `https://www.echoesandvisions.com`  
**Deploy pin (unchanged):** `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` · SHA `6258cada`  
**Workflow used:** authorised `POST /api/ai/generate-article` (cron-authenticated application path)  
**Not done:** publish · approve · schedule · social · app deploy · schema change

---

## 1. Editorial discovery (Phase 1)

### Recently published (public blog sample)

| Category | Recent themes |
| --- | --- |
| `bible-stories` | Pharaoh/bondage (Exodus analogy), David & Goliath (careful reading) |
| `ai-automation` / `ai-tools` | Small-business AI control, creator voice, weekly engines, ministry automation, one-person enterprise |
| `history` | Women in ancient civilizations |

### Gaps used for selection

- Biblical anxiety / Philippians peace (not covered by Exodus or David pieces)
- Pre-publish AI fact-checking habit (complements automation how-tos without duplicating “build a workflow”)
- Ordinary vocation / faithfulness (motivation category thinly represented vs AI volume)

### Method note

Drafts were created through the existing AI Generator research pipeline with Director-selected topics and curated `manualSources`. Scores below are **actual values returned by the generate-article response**, not invented. Full article-grounded audit detail is available on each article’s Audit page (admin session required).

---

## 2. Three topics and audience value

| # | Theme | Category | Audience value |
| --- | --- | --- | --- |
| 1 | Biblical wisdom / Christian living | `bible-stories` | Careful reading of Philippians 4:4–9 for anxious days—peace as biblical instruction, not a slogan |
| 2 | AI / responsible innovation | `ai-tools` | Practical fact-check habit before publishing AI-assisted drafts for creators and ministries |
| 3 | Personal growth / purpose | `motivation` | Faithfulness in ordinary work when a role feels small—vocation without career hype |

---

## 3. Articles ready for human review

### Article A — Biblical

| Field | Value |
| --- | --- |
| **Title** | When Peace Guards Your Mind: Philippians 4:4-9 for Anxious Days |
| **ID** | `cmwretawd000008jmpj176ufm` |
| **Slug** | `when-peace-guards-your-mind-philippians-4-4-9-for-anxious-days` |
| **Category** | `bible-stories` |
| **Status** | `review-required` |
| **Editorial score / grade** | **90** / `approval-candidate` |
| **Quality score / grade** | **90** / `excellent` |
| **SEO score / grade** | **100** / `excellent` |
| **Public URL** | Not published (HTTP 404 by design) |
| **Edit** | https://www.echoesandvisions.com/admin/articles/cmwretawd000008jmpj176ufm/edit |
| **Audit** | https://www.echoesandvisions.com/admin/articles/cmwretawd000008jmpj176ufm/audit |
| **Featured-image concept** | Quiet dawn light over an open Bible at Philippians 4; calm desk, no panic imagery, no text overlays |
| **Seed sources provided** | ESV/NIV Philippians 4 (Bible Gateway); APA anxiety topic page (labelled psychological context, not commentary) |

### Article B — AI / responsible innovation

| Field | Value |
| --- | --- |
| **Title** | Fact-Check Your AI Draft Before You Publish |
| **ID** | `cmwreucq1000908jmmm53chtu` |
| **Slug** | `fact-check-your-ai-draft-before-you-publish` |
| **Category** | `ai-tools` |
| **Status** | `review-required` |
| **Editorial score / grade** | **90** / `approval-candidate` |
| **Quality score / grade** | **90** / `excellent` |
| **SEO score / grade** | **90** / `excellent` |
| **Public URL** | Not published (HTTP 404 by design) |
| **Edit** | https://www.echoesandvisions.com/admin/articles/cmwreucq1000908jmmm53chtu/edit |
| **Audit** | https://www.echoesandvisions.com/admin/articles/cmwreucq1000908jmmm53chtu/audit |
| **Featured-image concept** | Split desk: laptop draft beside printed checklist and highlighter; human hands reviewing, not robot takeover imagery |
| **Seed sources provided** | NIST AI RMF; OpenAI usage policies; IFCN Code of Principles |

### Article C — Personal growth / purpose

| Field | Value |
| --- | --- |
| **Title** | Faithful in Ordinary Work: Purpose When Your Role Feels Small |
| **ID** | `cmwrevh7j000i08jmldtvmtxx` |
| **Slug** | `faithful-in-ordinary-work-purpose-when-your-role-feels-small` |
| **Category** | `motivation` |
| **Status** | `review-required` |
| **Editorial score / grade** | **70** / `review` |
| **Quality score / grade** | **90** / `excellent` |
| **SEO score / grade** | **100** / `excellent` |
| **Public URL** | Not published (HTTP 404 by design) |
| **Edit** | https://www.echoesandvisions.com/admin/articles/cmwrevh7j000i08jmldtvmtxx/edit |
| **Audit** | https://www.echoesandvisions.com/admin/articles/cmwrevh7j000i08jmldtvmtxx/audit |
| **Featured-image concept** | Ordinary workplace faithfulness—simple tools on a wooden table, warm natural light, dignity without glamour |
| **Seed sources provided** | Colossians 3:23–24; 1 Thessalonians 4:11–12 (ESV); APA purpose/meaning monitor article (psychological context) |

---

## 4. Quality assurance notes

| Check | Result |
| --- | --- |
| Landed in human-review queue | **Yes** — all three `review-required` |
| Not publicly live | **Yes** — blog slug GETs returned **404** |
| Invented scores | **No** — scores taken from generate-article JSON |
| Article C editorial grade | **`review` (70)** — needs Director editorial pass before approval candidacy |
| Research audit UI | Open each **Audit** link while signed in as editor; record consensus / source-quality / recommendation there (not re-invented here) |
| Theological certification | None claimed — biblical pieces must keep interpretation distinct from historical claims per EV-BIBLE-AUTHORITY-001 |

### Outstanding issues for Director

1. **Article C** — raise editorial quality (structure, specificity, claim restraint) before approval.  
2. Open **Audit** pages for A/B/C and confirm article-grounded recommendation, consensus, and source quality meet publication gate **before** any approve/schedule decision.  
3. Verify internal links and featured images in the Edit UI.  
4. Confirm no accidental overlap with unpublished drafts already in the queue (discovery may have peers).

---

## 5. Recommended publishing order (after human approval + passing audit)

1. **Fact-Check Your AI Draft Before You Publish** — timely, practical, complements existing AI library  
2. **When Peace Guards Your Mind…** — pastoral depth; pair carefully with counselling disclaimer if anxiety content warrants  
3. **Faithful in Ordinary Work…** — after editorial lift from grade `review`

**Publishing, approval, scheduling, and social remain separately authorised.**

---

## 6. Safety confirmation

| Boundary | Status |
| --- | --- |
| Published / scheduled / approved | **No** |
| Social publication | **No** |
| Production app code / schema / env | **Unchanged** |
| Production deploy identity | Still `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |

---

## 7. Final status

**EV-EDITORIAL-01: READY FOR DIRECTOR REVIEW** (three articles in `review-required`)
