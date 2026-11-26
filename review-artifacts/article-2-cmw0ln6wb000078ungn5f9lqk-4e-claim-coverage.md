# Article 2 — Milestone 4E claim coverage

Local extractor only. Engine `article-grounded-v14`. Ceiling 36. No sources were fetched and no research audit was run.

Proposed file: `review-artifacts/article-2-cmw0ln6wb000078ungn5f9lqk-4e-proposed.md`

## Counts

| Measure | Count |
| --- | ---: |
| Factual candidates | 36 |
| Selected within the 36-claim ceiling | 36 |
| `notScoredClaims` | 0 |
| Continuation claims | 17 |
| Overflow | 0 |

Section representation inside the 36:

| Section | Selected claims |
| --- | ---: |
| Australia | 2 |
| 1. Customer email drafting | 7 |
| 2. Appointment scheduling | 5 |
| 3. Social media content preparation | 2 |
| 4. Meeting summaries | 7 |
| 5. Customer enquiry triage | 4 |
| 6. Invoice and payment reminder preparation | 5 |
| 7. Business reporting | 4 |

All seven task sections are represented.

## Continuation claims and product identity

1. Eligible Workspace or Google AI plans, multiple languages. Publisher: Google. Feature: Help me write.
2. Outlook version limit and plain-text exclusion. Publisher: Microsoft. Feature: none detected.
3. Specific prompt, and Drive or email pull without an explicit instruction. Publisher: Google. Feature: Help me write.
4. No training outside the domain, allowed Workspace access, retention from 90 days to indefinite, and the personal-Gmail boundary. Publisher: Google. Feature: none detected.
5. Maximum of 20 guests and four proposed slots. Publisher: Google. Feature: Help me schedule.
6. Guest list, green and amber slots, calendars you can access, and inaccurate suggestions. Publisher: Google. Feature: Help me schedule.
7. Booking creates the event, and an existing appointment schedule can supply a booking page. Publisher: Google. Feature: Help me schedule.
8. Verify Teams recap results, and the page does not describe a recording-consent rule. Publisher: Microsoft. Feature: none detected.
9. Meet recipient limits, invited guests, and Drive retention. Publisher: Google. Feature: Take notes for me.
10. AI Inbox to-dos and topics. Publisher: Google. Feature: Gmail AI Inbox.
11. Primary tab, exclusions, and no attachments, delegated inboxes, or encrypted email. Publisher: Google. Feature: Gmail AI Inbox.
12. Smart features, up to 7 days, and no complaint or refund classification. Publisher: Google. Feature: Gmail AI Inbox.
13. QuickBooks reminder schedule, approval, invoice fields, and the off switch. Publisher: Intuit. Feature: none detected.
14. Late fee, drafted invoice email, default subject shown first, optional AI text. Publisher: Intuit. Feature: none detected.
15. Auto-fill review. Publisher: Intuit. Feature: none detected.
16. Unstructured data is not supported, and Copilot does not modify the workbook. Publisher: Microsoft. Feature: none detected.
17. Static inserts are not refreshable, and advanced analysis can insert refreshable Python. Publisher: Microsoft. Feature: none detected.

## Still outside the extractor

These lines remain in the draft and are not factual candidates: the Australian “treat it as unavailable” guidance, “this article does not describe Australian law or tax rules,” “you still decide whether that meeting goes ahead,” “you choose who receives those notes,” the AI Inbox open-reply-remove instruction, “revise a vague prompt before publication,” and the Excel code-view sentence in the checklist.

These saved-body statements are no longer in the draft: the opening product bullets, the click-Sources procedure, the Teams click path, the social-post sample prompts, the 30-minute Teams example, the AI Inbox bill and travel examples, the Excel example-question list, and the sentence that a person can change the duration or add and remove guests. The calendar-access limit itself remains.

## Evidence risks that remain

A continuation is checked on its own sentence. Several of those sentences now hold more than one limit, so a future passage has to contain the digits and negations in that sentence together. Examples are 20 and four, 90 days to indefinite, 7 days, “does not,” “not supported,” “encrypted,” and “retention.”

Some scored sentences name a publisher and no detected product feature: Outlook draft limits, Privacy Hub, Teams recap, QuickBooks Payments AI, Excel, and the Sheets scope sentence. Publisher-only identity can still accept another page from the same publisher.

The Meet language list and the 15-minute, 8-hour, and 10-second sentence are ordinary claims, not continuations. The continuation digit check does not apply to them.

“Conversations” stands in for the saved word “threads.” The limit is the same. The word was changed so the extractor does not treat “threads” as Meta.
