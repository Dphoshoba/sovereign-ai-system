# EV-REG-SPEC-1.0.0 test catalogue

Milestone 3X. This catalogue records section 14 of the adopted specification and the behaviour of baseline `article-grounded-v14`. It does not change that behaviour.

| Kind | Where it lives | What a passing run means |
|---|---|---|
| Executable baseline tests | `ev-reg-spec-1.0.0-baseline-characterisation.test.ts` and the existing editorial suite | Today's code still behaves as characterised. |
| Future contract specifications | `ev-reg-spec-1.0.0-future-contract.specification.ts` | Not collected by Vitest. Each case has `executable: false`. |

The executable file checks the recorded contract data, including the T-RESOLVED expectation of `primary-source supported` when dispute D1 is valid and no other dispute remains. It does not ask the current matcher to produce that state.

## Fixture comparison

| Fixture | Adopted contract | Current baseline |
|---|---|---|
| T-SAME-ORG | Partially supported, `publisher:microsoft`, count 1, `single-source-supported`, not publish-ready | Count 2, `verified`, `exact`. The publication guard accepts it, and consensus returns `publish-ready`. |
| T-NARROW | Partially supported, count 1, Google sentence not counted, not publish-ready | Count 1, `partially verified`, `single-source-supported`. Only the Learn URL is counted. Publication is blocked. The state label is the gap. |
| T-RESOLVED | Primary-source supported, count 1, `single-source-supported`, not publish-ready, D1 visible | Count 1, `partially verified`, score above 0. No `evidenceState` and no dispute record. Publication is blocked. |
| T-NEW-SPAN | Disputed, score 0, status `unverified`, method `disputed`. D1 does not cover D2 | Count 1, `partially verified`, score above 0. The contradictory Learn span is eligible support on the same publisher key. Method is not `disputed`. |
| T-JOINT | Primary-source supported, one work identity, count 1, not publish-ready | Count 1, hostname `www.cisa.gov`, `partially verified`. Named issuers do not add a second key. Publication is blocked. The primary-source label is the gap. |
| T-JOINT-PLUS-SECOND-WORK | Independently corroborated, the PDF identity plus `publisher:nist`, count 2, method `exact` | Count 2, `verified`, `exact`. The NIST page key is `www.nist.gov`, not `publisher:nist`, because the claim does not name NIST. The guard accepts the two hostnames. |
| T-TWO-WORKS | Independently corroborated, `business.gov.au` and `publisher:nist`, count 2, method `exact` | Count 1, `partially verified`. The NIST name makes the claim publisher-bound, so the business.gov.au passage is not eligible. Its corroboration key remains `www.business.gov.au`, and it is not counted. Publication is blocked. |

T-RESOLVED and T-NEW-SPAN dispute ids are defined by the specification helper from the claim, the clause "some Copilot features are not available in every region or language", and the contradicting passage checksum. The two ids differ. No production function emits them.

## Section 14 rows

| Case | Contract outcome | Baseline disposition |
|---|---|---|
| No substantiating passage | Unsupported, score 0 | Existing matcher tests. A zero-score fact is included in the new average characterisation. |
| Token overlap that misses the actor | Unsupported | New baseline: the Google wording of the Microsoft review sentence still counts. Future case `actor-overlap`. |
| One non-exclusive `.gov` document | Partially supported, count 1 | Existing `legacy-audit-safety.test.ts`. |
| NIST-named claim on `www.nist.gov` and `airc.nist.gov` | Primary-source supported, count 1 | Existing test already locks count 1 and `partially verified`. The label is future. |
| Microsoft-named Learn and Support | Primary-source supported, count 1 | Existing publisher-collapse tests. T-RESOLVED also locks count 1. |
| T-SAME-ORG | See fixture table | New baseline test. |
| Power Platform claim without Microsoft or Copilot | Exclusive `publisher:microsoft`, primary-source supported, count 1 | New baseline: key `learn.microsoft.com`, count 1, not publish-ready. Future case `power-platform-alias`. |
| Two paths and tracking variants of one URL | One document, count 1 | Existing `canonical-source-independence.test.ts`. |
| T-TWO-WORKS | See fixture table | New baseline test. |
| T-NARROW | See fixture table | New baseline test. |
| T-JOINT | See fixture table | New baseline test. |
| T-JOINT-PLUS-SECOND-WORK | See fixture table | New baseline test. |
| Primary scripture plus commentary | Commentary ineligible, count 1 | Existing article 3 source-identity tests. |
| "According to" one listed source | Primary-source supported, exclusive URL, count 1 | Existing attribution tests. The label is future. |
| "According to" two matches | Unsupported until attribution is unique | Existing attribution tests. |
| Material negation | Disputed, score 0, method `disputed` | T-NEW-SPAN baseline. Future case `dispute-precedence`. |
| Narrower true statement | `does-not-address`, no dispute from that pair | T-RESOLVED baseline leaves the Support sentence uncounted. |
| T-RESOLVED | Primary-source supported after D1, D1 visible | Recorded contract expectation. Baseline has no dispute record. |
| T-NEW-SPAN | Disputed, D1 does not cover D2 | Recorded contract ids. Baseline does not create D2. |
| Covered checksum changes | That dispute returns to unresolved | Future case `stale-dispute-resolution`. No resolver exists. |
| Versioned audit with `disputes` omitted | Guard fails closed | New baseline: a complete audit labelled `EV-REG-SPEC-1.0.0` still passes the guard when `disputes` is absent. |
| Versioned audit with `disputes: []` | No recorded dispute | Future case `missing-versioned-metadata`. |
| Primary-source confirmation | State and fingerprint unchanged, not publish-ready | New baseline: a `confirmationNote` does not clear a single-source block. An article-text edit changes the fingerprint. |
| Article text edited during review | Fingerprint changes and the audit is stale | Existing lifecycle and fingerprint tests, plus the new fingerprint assertion. |
| Theme source count 2 while each claim has count 1 | Not publish-ready | New baseline: the narrative can say independent sources support the statement, and the recommendation stays below `publish-ready`. |
| Unscored eligible claim | Recommendation leaves publish-ready | Existing evidence-completeness tests. |
| Corroborated claim with no substantiating URL | Recommendation leaves publish-ready | Existing evidence-completeness tests. |
| Missing or malformed fact metadata | Guard fails closed | Existing legacy-audit and publication-guard tests. |
| Consensus below 80, source quality below 70, or average verification below 80 | Not publish-ready | Existing source-quality tests. Constants remain 80 and 70. |
| Baseline audit without this specification version | Baseline gate only | `article-grounded-v14` remains the current revision. Historical revisions remain stale in the existing lifecycle tests. |
| Legacy verifier or publication-gate JSON | Cannot authorise article publication | New baseline: `publicationGate` can return `approved: true`, and that decision object is not a publishable article audit. |
| Unknown hosts `a.example.com` and `b.example.com` | Two identities | New baseline matches the contract. |
| Fetch failure | Not acquired, no invented passage | Existing source-acquisition tests. This milestone does not fetch. |
| Fingerprint or association mismatch | Not a current audit | Existing audit-association tests. |
| Material fact removed by an authorial pattern | Conformance failure | Future implementation test. Reclassifying a fact is not exercised here. |

## Safety specifications awaiting implementation

These entries are in `FUTURE_SAFETY_SPECIFICATIONS` and are not executable against current code.

| Id | Future requirement | What the baseline test locks today |
|---|---|---|
| missing-versioned-metadata | Omitted `disputes` on a versioned audit fails closed. | The current guard ignores the specification version. |
| historical-audit-compatibility | Baseline audits stay on the baseline gate. | `article-grounded-v14` is current. |
| publisher-spoofing | A title or path cannot assign `publisher:microsoft` to an unrelated host. | A title "Microsoft documentation" on `evil.example` currently receives `publisher:microsoft`. |
| duplicate-corroboration | One registry publisher is one identity for every claim shape. | T-SAME-ORG currently counts two hostnames. |
| primary-source-restrictions | Primary-source support cannot publish, and confirmation cannot edit the article. | One Microsoft passage stays `partially verified` and blocked. A confirmation field does not clear it. |
| dispute-precedence | An unresolved contradiction is disputed, score 0, method `disputed`. | T-NEW-SPAN keeps a positive partial score. |
| stale-dispute-resolution | A resolution covers one dispute id. A new checksum stays unresolved. | T-NEW-SPAN's contract id differs from D1. No runtime resolution exists. |
| human-approval-boundaries | Approval, scheduling, and publication stay separate. | `publicationGuard` allows an approved status and still does not clear a single-source research block. |
| legacy-publication-gate-isolation | Legacy JSON cannot authorise an article. | The decision object fails the article guard. |
| verification-average-consistency | The stored average is the average used for the recommendation, including zeroes. | The matcher average omits a zero score. `consensusEngine` does not return its average. |

Authority scores are characterised and left unchanged: a URL whose path contains `.gov` scores 65 for one supporting passage, and the same host without that substring scores 53. OD-7 keeps the four authority tables in place for this programme.
