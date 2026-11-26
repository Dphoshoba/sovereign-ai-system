# Article 2 — Milestone 4G claim coverage

Local extractor only. Engine `article-grounded-v14`. Ceiling 36. No sources were fetched and no research audit was run.

Proposed file: `review-artifacts/article-2-cmw0ln6wb000078ungn5f9lqk-4g-proposed.md`

## Counts

| Measure | Count |
| --- | ---: |
| Factual candidates | 142 |
| Selected within the ceiling | 36 |
| `notScoredClaims` | 106 |
| Continuation claims inside the 36 | 26 |
| Overflow | 106 |

Selected claims by section:

| Section | Selected |
| --- | ---: |
| Australia | 4 |
| 1. Customer email drafting | 23 |
| 2. Appointment scheduling | 4 |
| 3. Social media content preparation | 1 |
| 4. Meeting summaries | 1 |
| 5. Customer enquiry triage | 1 |
| 6. Invoice and payment reminder preparation | 1 |
| 7. Business reporting | 1 |

All seven task headings are present. The selector keeps the first sentence of each task, then fills the rest from the front of the article. Email therefore occupies most of the 36. The green-slot sentence and everything after it in scheduling, plus the later sentences in social, meetings, the inbox, QuickBooks, and Excel, are the overflow.

## Material statements omitted from extraction

These remain in the draft and are not candidates:

- Treat a United States-only, beta, or plan-gated feature as unavailable until the account shows it.
- This article does not describe Australian law or tax rules.
- You still decide whether that meeting goes ahead, and the other named-person instructions.
- This article does not describe Sheets charts or formulas.
- You can expand the code used to produce it, including an optional summary of that code.

The vendor limits those lines point at are in the candidate set. Most of the later vendor limits are candidates and are also in `notScoredClaims`.

## Facts still combined in one claim

- Copilot can say what you missed, including a mention and assigned action items.
- A maximum of 20 guests and four slots.
- Retention from 90 days to indefinite.
- Notes recommended from 15 minutes to 8 hours.
- Explicit consent covers note-taking, recording, and transcription in one sentence.
- Help me write can generate a draft or refine text you already have.
- Excel can answer questions about tables or table-like ranges.

A continuation is checked on its own last sentence, so the earlier sentences in the same span are not re-checked as that claim’s evidence target.
