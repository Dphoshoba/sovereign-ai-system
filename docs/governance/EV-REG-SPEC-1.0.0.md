# EV-REG-SPEC-1.0.0 — Unified Research Evidence Governance

| Field | Value |
|---|---|
| Specification ID | EV-REG-SPEC-1.0.0 |
| Status | PROPOSED — not adopted, not implemented |
| Date | 2026-11-14 |
| Revision | 3T, incorporating the Milestone 3S safety review |
| Repository | sovereign-ai-system |
| Branch | integrate/production-research-integrity |
| Baseline commit | d654d85c1583b1fe426d65052d991c3a5c967a14 |
| Governing article used as evidence | cmw0ln6wb000078ungn5f9lqk, status review-required |
| Programme | Echoes & Visions Milestones 3P, 3R, and 3T |
| Supersedes | None. This document does not replace the certified baseline. |

This file is a proposed contract. It is not adopted policy, and it does not implement, authorise, or change anything in the running system.

The normative sections describe the contract that would become binding only after a later written adoption approval. Section 16 records the proposed resolutions of OD-1 through OD-9. Those resolutions are not adopted by this revision. A later adoption approval would close them in writing. That approval would not change code, tests, Production, article text, research sources, or audits, and it would not confirm, approve, schedule, or publish article `cmw0ln6wb000078ungn5f9lqk`.

Until that adoption approval, the enforced behaviour remains baseline commit `d654d85c1583b1fe426d65052d991c3a5c967a14`.

This file is not linked from existing documents. Linking it would edit the frozen baseline.

## 1. Purpose

The editorial research path must be able to tell these situations apart:

1. A claim has no passage that substantiates it.
2. A claim is substantiated, and that support meets neither the primary-source rule nor the independent-corroboration rule.
3. A claim is substantiated by one authoritative primary source and by no second publisher.
4. A claim is substantiated by at least two independent publishers.
5. Allowed sources materially contradict one another.

The baseline Prepare for Review path stores unsupported, single-identity partial support, and multi-identity support. It binds primary scripture to one document and collapses a named publisher to one identity. It does not store primary-source support or dispute as their own states. `groundedFactVerification` and `factVerificationEngine` count independence differently. This specification defines the missing states and the single contract both engines would share after adoption and a later implementation programme.

## 2. Normative language

- **Must** and **must not**, inside this document, bind a future implementation that claims conformance after this specification is adopted. They do not bind the baseline.
- **Current baseline** means behaviour present at `d654d85c1583b1fe426d65052d991c3a5c967a14`.
- **Proposed** means the contract in this revision.
- Where this document is silent, the current baseline remains in force.
- Written adoption of this revision would close OD-1 through OD-9 as resolved in section 16. Adoption would not grant implementation authority.

## 3. Terms

| Term | Meaning |
|---|---|
| Full-claim substantiation | A retrieved passage states the claim’s actor, action, and scope, including every quantity, date, region, and limit in the claim. Token overlap may select a candidate passage. Overlap alone does not substantiate. |
| Evidence quality | Whether an allowed passage meets full-claim substantiation. |
| Source authority | A numeric document class used in source-quality and verification-score formulas. Authority does not create a second publisher and does not make a claim publish-ready. |
| Publisher independence | Two substantiating passages are independent only when their canonical publisher identities differ. |
| Claim verification | The single evidence state assigned to one scored factual claim by the evaluation order in section 4. |
| Human editorial confirmation | Audit metadata recording that a reviewer has confirmed or declined to confirm a primary-source-supported claim. Confirmation does not change article content, the machine state, or publication eligibility. |
| Canonical publisher | The identity assigned by section 6. Registry publishers have one reviewed id. Unknown hosts use the full hostname with a leading `www.` removed. |
| Primary source | The document issued by the publisher that owns the fact. The three classes are the cited scripture edition, the vendor’s own product documentation, and authoritative official guidance issued by the body whose guidance the claim states. |
| Authoritative official guidance | A public body’s own guidance page or document about the rule or practice that body issues. A quotation, summary, or commentary on another site is not that primary source. |
| Scored factual claim | A sentence the article-claim extractor classifies as externally verifiable. Reclassifying a material fact as authorial in order to avoid this specification is non-conformant. |
| Current audit | An audit whose content fingerprint, source-set fingerprint, and association timestamp match the article revision under the baseline audit rules. |
| Versioned audit | An audit that records specification version `EV-REG-SPEC-1.0.0`. Only a versioned audit can be judged by the conformance gate in section 11. |
| Passage checksum | SHA-256 of the passage after Unicode NFC, trim, and collapse of whitespace to a single space, encoded as UTF-8. |
| Source-set fingerprint | The ordered fingerprint of the article’s listed source URLs for that audit. A change to the text retrieved from a URL that is already listed does not, by itself, change this fingerprint. |
| Dispute identity | The `disputeId` defined in section 7.2. A resolution names one dispute identity and applies to no other. |

## 4. Evidence states

Every scored factual claim has exactly one state. The evaluator recomputes that state from the current evidence and from every dispute record that applies to the claim. It applies this order and stops at the first match:

1. **Disputed**, when any applicable dispute record is unresolved, or its resolution has expired under section 7.4. One matching resolution does not clear any other dispute record.
2. **Unsupported**, when no allowed passage substantiates the full claim.
3. **Independently corroborated**, when at least two independently authored works, with different canonical publisher identities, each substantiate the full claim.
4. **Primary-source supported**, when exactly one canonical publisher substantiates the full claim and that publisher is the exclusive primary source under section 6.
5. **Partially supported**, when one or more allowed passages substantiate the full claim and none of the earlier states apply.

An unresolved material contradiction takes precedence over every other evidence state. A claim cannot leave disputed while any applicable unresolved material contradiction remains. A claim that also has a substantiating passage stays disputed until every applicable dispute record has a current, unexpired resolution or no longer applies.

### 4.1 Unsupported

No allowed passage substantiates the full claim, and section 7 does not place the claim in disputed.

A candidate passage that shares tokens and misses the actor, action, scope, quantity, or limit stays in the audit as a non-substantiating candidate. It does not move the claim out of unsupported.

Current baseline mapping: `verificationStatus = unverified`, `verificationCount = 0`, `verificationScore = 0`.

Publication effect: the article cannot be publish-ready.

### 4.2 Partially supported

One or more allowed passages substantiate the full claim. The support is not exclusive primary-source support, and fewer than two canonical publishers substantiate the full claim. No unresolved dispute applies.

Examples: one secondary page that states the full claim; several mirrors of one non-primary document.

Current baseline mapping: `partially verified`, method `single-source-supported`, when the baseline identity count is 1 and the primary-source rule does not apply.

Publication effect: the claim is single-source. The article cannot be publish-ready. The partial score remains `min(70, 40 + round(authority × 0.25))`.

### 4.3 Primary-source supported

All of the following are true:

- Section 7 does not place the claim in disputed.
- Exactly one canonical publisher substantiates the full claim.
- That publisher is the exclusive primary source for the claim.
- The substantiating document is that publisher’s primary scripture, vendor product documentation, or authoritative official guidance.
- The passage was retrieved through the approved fetcher.

Scripture, a vendor’s product-behaviour claim, and a public body’s own guidance are all primary-source classes. Each remains one publisher. A commentary, a mirror, or another body’s page does not add an identity. Another body’s own document can become a second publisher only when the claim is not exclusively attributed and that document substantiates the same full claim.

Current baseline mapping: `partially verified`, count 1, method `single-source-supported`. The baseline has no distinct label. A conformant implementation must persist `primary-source-supported` and must not store it as `verified`.

Publication effect: the claim remains single-source. Human confirmation under section 9 does not promote it and does not make the article publish-ready. There is no primary-source exception that permits publication.

### 4.4 Independently corroborated

At least two independently authored works, with different canonical publisher identities, each have an allowed passage that substantiates the full claim, and section 7 does not place the claim in disputed. One document or one registry-marked joint work contributes at most one of those identities.

The passages must agree on actor, action, scope, and every quantity in the claim. A second publisher that states a narrower or different fact does not corroborate the full claim.

Current baseline mapping: `verified`, count at least 2, method `exact`, where the baseline already counts two identities. After a conformant implementation, those identities are canonical publishers under section 6. Two hostnames of one registry publisher count as one identity for every claim shape.

Publication effect: this is the only machine state that can satisfy the per-claim corroboration requirement.

### 4.5 Disputed

Two or more allowed passages address the same material clause of the claim, and those passages cannot both be true of that clause. Section 7 is the test. This state applies even when the claim would otherwise be unsupported, partially supported, primary-source supported, or independently corroborated.

Current baseline mapping for a future versioned audit: `verificationStatus = unverified`, `verificationScore = 0`, `verificationMethod = disputed`. The method must not be `exact` or `semantic`. `verificationCount` still records how many canonical publishers substantiate the full claim, and that count does not clear the dispute.

Publication effect: an unresolved dispute blocks publish-ready even when the numeric thresholds are met. A resolved dispute record retires only its own `disputeId`.

## 5. Evidence-state transition model

A new audit assigns the state by the section 4 order. It does not walk a claim through intermediate states, and a reviewer must not edit a stored state in place.

```text
evidence in
    |
    +-- unresolved material contradiction --> Disputed
    |
    +-- no full-claim substantiation ------> Unsupported
    |
    +-- two canonical publishers -----------> Independently corroborated
    |
    +-- one exclusive primary publisher ----> Primary-source supported
    |
    +-- otherwise --------------------------> Partially supported
```

Allowed changes on a later audit:

| Previous assignment | New assignment | Condition |
|---|---|---|
| Any state | Disputed | Any applicable dispute record is unresolved or its resolution has expired. A new contradictory passage creates a new dispute record even when its URL is already in the source set. |
| Any non-disputed state | Unsupported | No allowed passage now substantiates the full claim, and no applicable dispute is unresolved or expired. |
| Unsupported | Partially supported | A passage now substantiates the full claim, and sections 4.3 and 4.4 do not apply. |
| Partially supported | Primary-source supported | Section 4.3 becomes true. |
| Partially supported or primary-source supported | Independently corroborated | A second canonical publisher now substantiates the full claim, and no dispute is unresolved. |
| Independently corroborated | Primary-source supported | One publisher’s support is withdrawn and the remaining publisher is the exclusive primary source. |
| Independently corroborated | Partially supported | One publisher’s support is withdrawn and the remaining support is not exclusive primary-source support. |
| Disputed | The single state assigned by section 4 from the remaining evidence | Every applicable dispute record has a resolution that still matches that record’s own `disputeId`, passage checksums, and source-set fingerprint, or the contradiction in that record is no longer present. A matching fingerprint does not clear any other dispute. The reviewer does not choose the resulting state. The claim stays disputed while any applicable unresolved material contradiction remains. |

Prohibited transitions:

- Human confirmation must not move primary-source supported to independently corroborated.
- A second document, subdomain, or mirror of the same publisher must not cause that move.
- Token overlap without full-claim substantiation must not move a claim out of unsupported.
- Changing the extractor so that a material fact becomes authorial must not be used as a transition.
- Lowering consensus, source quality, or average-verification thresholds must not be used as a transition.
- Clearing a dispute must not approve, schedule, or publish the article.
- A resolution whose fingerprint and checksums match must not retire any dispute record other than the `disputeId` it names.
- A claim must not leave disputed while any applicable dispute record is unresolved or expired.

## 6. Publisher identity rules

### 6.1 Registry publishers and unknown hosts

A registry entry contains a stable publisher id, the hosts and related properties that collapse into that id, the document classes that count as that publisher’s primary source, and any product aliases that make a product-behaviour claim exclusive to that publisher.

For a registry publisher, the following are one identity:

- every host listed on that entry, including its subdomains and related properties
- `www` and apex forms of those hosts
- URL variants that differ only by trailing slash, fragment, default port, or tracking parameters (`utm_*`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`)
- a PDF and an HTML page that the registry marks as the same work

For a host that is not on a registry entry, the identity is the full hostname with one leading `www.` removed. Subdomains of an unknown host remain different identities. This specification does not collapse unknown hosts by registrable domain or by a public-suffix list.

The following are not independent:

- two paths on one hostname
- `learn.microsoft.com` and `support.microsoft.com`, both publisher `microsoft`
- `www.nist.gov` and `airc.nist.gov`, both publisher `nist`
- `about.fb.com`, `facebook.com`, and `meta.com`, all publisher `meta`
- a quotation of a primary page on a blog or another site

### 6.2 Baseline registry

The proposed first registry is the baseline named-publisher list: `nist`, `deloitte`, `pwc`, `cdo`, `microsoft`, `google`, `meta`, `intuit`, `xero`.

Their existing host families are the minimum membership. Product aliases already used by the baseline claim patterns stay in force, including Copilot and Outlook for `microsoft`. The proposed registry also aliases Power Platform to `microsoft`, so a product-availability claim about Power Platform remains exclusive to Microsoft when the sentence does not repeat the words “Microsoft” or “Copilot”.

Adding, splitting, or aliasing an id requires the same review as a specification amendment. Unknown hosts do not inherit an identity from a substring of the path or query, including the substrings `.gov` and `microsoft`.

### 6.3 How a claim selects identities

This table is the proposed identity rule for every verifier named in section 8.

| Claim shape | Eligible evidence | Independence key |
|---|---|---|
| Primary scripture, including “According to 1 Samuel 17” | The exclusive listed scripture document only | That document. Commentary cannot add an identity. |
| Named secondary document | The exclusive listed document for that named work | That document |
| One named registry publisher, or a product alias of that publisher | Sources in that publisher’s registry entry | `publisher:<id>` |
| Authoritative official guidance attributed to one issuing body | That body’s own retrieved guidance document | That publisher id, or the full hostname when the body is not in the registry |
| Two named registry publishers in one sentence | Each named publisher, only from an independently authored work, and each passage must substantiate the full sentence | One key per publisher that meets full-claim substantiation. Two names on one work do not create two keys |
| “According to” a listed source, with one match | That URL only | That document |
| “According to” a listed source, with more than one match | None until the attribution is unambiguous | Unresolved attribution. The claim is unsupported. |
| Ordinary unattributed claim | Any listed source whose passage substantiates the full claim | Registry id when the host is registered; otherwise the full hostname with a leading `www.` removed |

One document, one URL, or one registry-marked joint work contributes at most one corroboration identity. That identity is the work id when the registry marks the work, and otherwise the document’s full hostname with one leading `www.` removed. Naming several issuers on that work does not create additional identities. Publisher names printed on the same PDF do not create independent verification. The same limit applies to attributed and unattributed claims.

Independent corroboration requires substantiating passages from at least two independently authored works whose canonical publisher identities differ. A second page, mirror, or issuer list on the first work is not that second work. A claim that attributes a fact to one issuer of a joint work still draws only the joint work’s single identity from that document.

A product-behaviour claim stays exclusive to the vendor when the sentence names that vendor or one of its product aliases. Another organisation’s statement about a different product does not corroborate it.

### 6.4 One identity rule

After implementation, `evidenceCorroborationKey`, `qualifyingPublicationSourceIdentity`, `independentDocumentKey`, and `factVerificationEngine` must all use section 6.3. Until that implementation exists:

- Prepare for Review and the article publication guard remain the editorial authority.
- A path-level document count must not override a publisher-level count.
- The JSON returned by `POST /api/research/publication-gate` is a legacy research response. It is not an article audit. It cannot authorise approval, scheduling, or publication.

## 7. Contradiction-handling requirements

### 7.1 What counts as a contradiction

A contradiction exists when two allowed passages address the same material clause of the claim and cannot both be true of that clause. Material differences are:

- polarity, such as “is available” and “is not available”
- a number, percentage, date, version, or region
- the actor who issued the statement
- the scope, such as one product versus every product, or one region versus all regions

Paraphrase, extra caution, and a narrower true statement are not contradictions. A passage that does not address the claim has polarity `does-not-address`. It does not create a dispute, and it does not substantiate the claim.

### 7.2 Detection

The first conformant implementation records human-recorded disputes. A machine detector may later propose polarity `contradicts`. A machine proposal cannot set resolution to `not-a-contradiction` or `source-withdrawn`.

Every versioned audit stores a `disputes` array. The array is present even when it is empty. An empty array means no dispute is recorded. A missing `disputes` array on a versioned audit is missing metadata and fails closed. A baseline audit has no `disputes` array; that absence stays on the baseline gate and is not read as either “no dispute” or a conformance pass. Dispute records and the method `disputed` exist only on versioned audits.

A dispute record has one `disputeId`. The id is the SHA-256, as lowercase hex, of the UTF-8 bytes of this canonical text, with no trailing newline:

```text
claim:<NFC claim text, trimmed, whitespace collapsed to one space>
clause:<NFC material clause, trimmed, whitespace collapsed to one space>
passages:<each contradicting source URL, space, passage checksum, sorted by URL then checksum, joined by |>
```

The contradicting passages are the passages whose polarity is `contradicts` for that clause. A different passage, a different checksum, or a different clause produces a different `disputeId`. A newly discovered contradictory passage therefore creates a new unresolved dispute record even when its URL is already in the source set. The source-set fingerprint does not change merely because that URL was already listed. The earlier resolution does not cover the new `disputeId`.

Each dispute record contains:

- `disputeId`
- claim text and article excerpt
- source-set fingerprint at the time the record was created
- each candidate source URL, title, canonical publisher id, passage, passage checksum, and polarity
- polarity for each passage: `supports`, `does-not-address`, or `contradicts`
- the material clause in conflict
- detection method: `human-recorded` or `machine-candidate`
- resolution: `unresolved`, `not-a-contradiction`, or `source-withdrawn`
- when resolution is not `unresolved`: `disputeId`, resolver, timestamp, the source-set fingerprint, and the passage checksums the resolution covers

### 7.3 Effect

- Any applicable unresolved dispute, or a resolution whose binding has expired, sets the claim state to disputed. This precedes unsupported, partially supported, primary-source supported, and independently corroborated.
- A resolution applies only to the `disputeId` it stores. A matching source-set fingerprint does not clear any other dispute record.
- The versioned compatibility fields are status `unverified`, score 0, and method `disputed`.
- Method `disputed` must not satisfy a guard that accepts `exact` or `semantic`.
- The publication recommendation cannot be `publish-ready` while any applicable dispute on that versioned audit is unresolved or expired.
- The consensus narrative must not describe a disputed group as independent support.
- Dispute clearance does not approve, schedule, or publish. The approval record for a later gate must show every cleared dispute and the `disputeId` of its resolution.

### 7.4 Resolution

A reviewer may record one of these reasons:

- the passages do not address the same clause
- one passage is outside the claim’s scope
- one source is not allowed for the claim
- one source was withdrawn from the article’s source set

The resolution is valid only for its own `disputeId`, and only while that dispute’s passage checksums still match the checksums stored on the resolution and the audit’s source-set fingerprint still matches the fingerprint stored on the resolution. Any change to a covered checksum or to the source-set fingerprint expires that resolution and returns that dispute to unresolved. A new contradictory passage creates a new `disputeId` and does not inherit the expired or current resolution.

The next audit recomputes the claim from all current passages and all current dispute records, using the section 4 order. The reviewer does not choose the state. The claim remains disputed while any applicable dispute is unresolved or expired. Expired and current resolution notes remain in provenance.

Resolution is not approval, scheduling, or publication.

## 8. Unified verification-engine contract

### 8.1 Editorial authority

`groundedFactVerification` in Prepare for Review is the editorial verifier. `consensusEngine`, evidence completeness, and `researchPublicationBlockReason` consume its result for an article.

`factVerificationEngine` is the legacy verifier. It groups similar claim strings and counts `independentDocumentKey`, which preserves the document path. That count can treat two paths on one host as two sources. The editorial matcher does not. Generation routes, research API routes, citation building, article composition, and `POST /api/research/publication-gate` call the legacy verifier. Their results are outside article publication. The publication-gate route’s JSON cannot be copied into a `ResearchAudit` and cannot satisfy the article publication guard.

The legacy similarity merge must not fuse distinct scored sentences. After implementation, the article-claim extractor’s claim boundaries are the claims the shared function scores.

### 8.2 Target result

A conformant implementation returns one result per scored claim:

| Field | Requirement |
|---|---|
| `evidenceState` | The first matching state in section 4 |
| `verificationStatus` | Unsupported and disputed map to `unverified`. Partial and primary-source supported map to `partially verified`. Independently corroborated maps to `verified`. |
| `verificationCount` | Number of canonical publishers whose passages substantiate the full claim. Mirrors and same-publisher hosts do not increment it. A disputed claim may still report a count above 1. |
| `verificationMethod` | `disputed` when the state is disputed. `single-source-supported` when the count is below 2 and the state is not disputed. `exact` when the state is independently corroborated. A new editorial audit must not use `semantic`. |
| `verificationScore` | 0 when unsupported or disputed. `min(70, 40 + round(authority × 0.25))` when the count is 1. `min(100, 55 + count × 15 + round(authority × 0.2))` when independently corroborated. |
| `publisherIds` | The canonical ids counted |
| `supportingPassages` | URL, title, passage, checksum, and polarity. Non-substantiating candidates are labelled `does-not-address` or retained as candidates, not as support. |
| `disputes` | The claim’s records from the versioned audit’s `disputes` array |
| `retrievalFailures` | Section 10 records for eligible sources that were not acquired |

Both engines call this function, or the legacy engine stops returning publication recommendations. Threshold constants stay `PUBLISH_READY_CONSENSUS_SCORE = 80` and `PUBLISH_READY_SOURCE_QUALITY_SCORE = 70`.

### 8.3 Authority tables

The baseline has different authority tables in the editorial matcher, the consensus engine, the legacy verifier, and `scoreAuthority` / `scoreTrust`. This specification does not merge or retune them. A later implementation programme proposes one verification-score table and one source-quality table without changing the 80 and 70 gates. That later table must classify the hostname, not a substring of the path or query.

Source authority remains an input to scores. It is not a substitute for publisher independence.

### 8.4 Full-claim support

A passage substantiates a claim only under section 3. A passage about a different product, a narrower rollout, or a general caution does not substantiate a stronger sentence. The audit retains the passage so a reviewer can see why it did or did not substantiate the full claim.

## 9. Human review of primary-source-supported claims

This procedure applies when the machine state is primary-source supported. It is not a route to publication for a partially supported claim, and it is not an article edit.

1. The reviewer reads the stored passage beside the exact claim sentence.
2. The reviewer checks that the passage substantiates the full claim and its scope limit.
3. The reviewer checks that the source is the canonical primary document: the scripture edition, the vendor’s product document, or the issuing body’s own guidance. A mirror, quotation, or commentary does not qualify.
4. The reviewer may cite a limitation that is already present in the article. Putting a new limitation into the article is a separate editorial save. That save is not part of confirmation, changes the content fingerprint, invalidates the current audit, and requires its own approval before any new audit.
5. The reviewer stores confirmation metadata: claim text, source URL, passage checksum, decision `confirmed` or `rejected`, reviewer, and timestamp. The note does not change article content.
6. `confirmed` leaves the machine state at primary-source supported. The article recommendation remains `review-required` while that claim, or any other single-source or disputed claim, remains.
7. `rejected` records that the reviewer did not confirm the claim. It does not assign a new state. The next audit recomputes the state from the evidence. If the reviewer believes the passage does not substantiate the claim, the reviewer records a dispute or a source withdrawal under section 7.4 instead of choosing unsupported or partial directly.
8. Confirmation does not approve, schedule, or publish the article.

An article whose scored factual claims are all independently corroborated can proceed through the ordinary publication gate. One primary-source-supported claim keeps the article out of `publish-ready`.

## 10. Audit provenance, retrieval, completeness, and invalidation

### 10.1 Provenance a versioned audit stores

- specification version `EV-REG-SPEC-1.0.0`
- article id and content fingerprint
- ordered source-set fingerprint
- association timestamp used by the baseline freshness rule
- explicit `disputes` array, empty when no dispute is recorded
- for each listed source: URL, title, canonical publisher id when known, acquisition category, HTTP status category, extracted character count, accepted passage count, and rejection reason
- for each scored claim: the fields in section 8.2
- not-scored claim texts
- consensus score, source-quality score, average verification score, and publication recommendation
- confirmation notes, stored as audit metadata

Average verification score must be present on a versioned audit. The baseline consensus engine calculates that score and uses it for the recommendation, and it does not currently return the field. A baseline audit is not failed for lacking a field this specification adds.

### 10.2 Retrieval failure

A fetch failure, forbidden response, empty extraction, or timeout means the source was not acquired. It is not evidence that the claim is false, and it is not a substantiating passage. The diagnostic is stored. A reviewer must not paste an unfetched page into the audit.

Eligible official pages that the fetcher cannot acquire remain unavailable. They must not be replaced by a quotation on another site.

### 10.3 Evidence completeness

On a versioned audit, the recommendation must leave `publish-ready` when any scored claim lacks an accepted substantiating URL, or when the extractor leaves an eligible factual claim unscored. This preserves the current completeness behaviour.

### 10.4 Historical audits and invalidation

- A change to audited article content or to the source set invalidates the current audit under the baseline rules.
- An audit whose fingerprint matches, but whose association timestamp does not, is not current.
- Baseline audits do not record this specification version. They remain subject to the baseline publication gate. They are not reread as conformant, and a missing dispute field is not treated as “no unresolved disputes” under section 11.
- Only a versioned audit can satisfy the dispute and editorial-engine invariants in section 11.
- A new versioned audit requires the existing separate audit approval. Saving or adopting this document does not create one.
- A second audit of an unchanged fingerprint remains forbidden by the baseline duplicate-audit rule.
- Confirmation metadata must not change the article content fingerprint.

## 11. Publication safety invariants

Numeric thresholds are unchanged. There is no primary-source exception that permits publication.

For a **versioned** audit, `publish-ready` is permitted only when every row below holds:

| Invariant | Requirement |
|---|---|
| Consensus | `consensusScore >= 80` |
| Source quality | `sourceQualityScore >= 70` |
| Average verification | `averageVerificationScore >= 80`, and the field is present |
| Unsupported claims | `unverifiedFacts = 0`. Disputed claims are included because their compatibility status is `unverified`. |
| Single-source claims | count is 0. Primary-source supported and partially supported both count as single-source. |
| Disputes | the `disputes` array is present, and no dispute is unresolved or expired |
| Audit currency | the audit matches the current content revision, source set, and association timestamp |
| Human approval | a separate explicit editorial approval exists after that current audit |
| Engine | the audit was produced by the editorial verifier using section 6.3. The legacy publication-gate JSON does not qualify. |
| Completeness | no unscored eligible factual claim and no scored claim without a substantiating URL |

A **baseline** audit is judged only by the baseline gate: consensus at least 80, source quality at least 70, the baseline recommendation `publish-ready`, no unverified fact under the baseline fields, no single-source fact under the baseline fields, a current revision-matched audit, and separate human approval. Section 11’s dispute-array and editorial-engine rows do not apply to a baseline audit. Applying them to a baseline audit would be non-conformant.

Additional invariants for a versioned audit:

- The publication guard fails closed when verification metadata, the specification version, or the `disputes` array is missing, null, or malformed.
- Identical URLs, tracking variants, `www` variants, and two paths on one hostname do not satisfy independence.
- Two hosts of one registry publisher do not satisfy independence for any claim shape.
- Two unknown subdomains are independent of each other because each keeps its full hostname.
- Theme-level source counts and consensus narratives do not satisfy the per-claim identity rule.
- Primary-source confirmation notes do not satisfy the gate.
- A cleared dispute remains visible on the audit presented for approval.
- Approval, scheduling, and publication remain separate actions.
- Featured-image, schedule, and lifecycle rules outside this specification remain in force.

The consensus formula may continue to award theme-level corroboration when several claims in one theme cite different documents. That figure must not be described as independent corroboration of each claim, and it must not override a single-source fact or a dispute.

## 12. Worked baseline of the governing article

This section records why article `cmw0ln6wb000078ungn5f9lqk` is not publish-ready. It does not change the article, confirm its claims, or authorise an audit.

Local non-persistent scoring of the saved revision, reported in Milestones 3M and 3N, gave consensus 79, average verification 59, source quality 90, zero unverified claims, two single-source claims, and recommendation `review-required`.

The saved check-sources sentence is exclusively attributed: “According to business.gov.au, AI-generated information should be checked against trustworthy sources before it is relied upon.” The saved geographic sentence names Microsoft and Copilot and states that some Copilot and generative AI features are not available in every region or language.

| Saved claim | Retrieved passage | Proposed state | Why the count stays 1 |
|---|---|---|---|
| The exclusive business.gov.au sentence | business.gov.au states that AI-generated information should be checked against a trustworthy source before it is relied upon | Primary-source supported. The class is authoritative official guidance. The identity is the full hostname `business.gov.au`, because that host is not in the baseline registry. | The sentence’s “According to” binding admits only that URL. NIST and NCSC passages that were acquired do not state the full guidance. ACSC, digital.gov.au, industry.gov.au, and eSafety pages were not acquired. |
| The Microsoft Power Platform sentence | Microsoft Learn states that Copilots and generative AI features are not available in all regions and languages | Primary-source supported. The class is vendor product documentation. The identity is `publisher:microsoft`. | Learn and Support are one registry publisher. The Support languages page states a different rollout fact and does not substantiate the full claim. |

Under section 9, a later separately approved review could confirm either passage in audit metadata. The article would remain `review-required`. Removing the exclusive attribution, or editing the article so the scope limitation changes, is not authorised by this specification.

## 13. Migration and backward compatibility

| Risk | Effect | Control |
|---|---|---|
| Stricter publisher identity | An unattributed claim that the baseline verifies from two hostnames of one registry publisher becomes one publisher on a future versioned audit. | Existing baseline audits are not rewritten. Section 14 tests the stricter result. |
| New dispute invariant | Old audits have no `disputes` array. | Only versioned audits can satisfy section 11’s dispute row. Baseline audits stay on the baseline gate. |
| Distinct primary-source label | Historical `partially verified` rows do not say whether they were primary sources. | Do not backfill. The next approved versioned audit assigns the state. |
| Legacy engine | Research API and generation routes can still count path-level documents. | Their output, including the publication-gate JSON, cannot authorise article publication. |
| False contradiction | A negation heuristic can flag a caution or a narrower true statement. | Machine output stays `machine-candidate` and unresolved until a bound human resolution. |
| Stale dispute clearance | A resolution could hide a later contradictory passage, including a new span from a URL that is already listed. | A resolution retires only its own `disputeId`. A new contradictory checksum creates a new unresolved dispute. The claim stays disputed while any applicable dispute is unresolved or expired. |
| Publisher spoofing | A host added to the wrong registry entry could verify a vendor claim. A path containing `.gov` could inflate an authority score. | Registry changes require a specification amendment. Identity and any future authority table use the hostname, not a path substring. |
| Accidental publication | A confirmation note, a theme-level count, or the legacy gate JSON could be mistaken for the article gate. | Section 11 separates baseline and versioned gates. Confirmation and legacy JSON do not satisfy either article gate. |
| Threshold drift | A future change could lower 80 or 70 to clear the governing article. | Those constants are unchanged by this specification. |
| Article-specific workaround | Deleting a true product or guidance sentence, or marking it authorial, would evade scoring. | Non-conformant under section 3. |

Backward-compatible commitments:

- Baseline audits continue to be judged by the baseline gate.
- Saving, approving, scheduling, and publishing behaviour does not change when this document is revised or later adopted.
- ResearchSource rows are not migrated.
- The article status `review-required` is not a defect under either the baseline or this proposal.
- Unknown hosts keep the full hostname, with only a leading `www.` removed, which matches the baseline hostname key for those hosts.

## 14. Regression-test plan

Tests are not added by this milestone. The implementation programme must add them before any verifier change. Existing baseline tests keep passing until the same reviewed change updates the tests whose expected identity count becomes stricter under section 6.

Each new case has one expected outcome:

| Case | Expected outcome |
|---|---|
| No substantiating passage | Unsupported, score 0, not publish-ready |
| Token overlap that misses actor, action, or scope | Unsupported. The passage is retained as a non-substantiating candidate. |
| One `.gov` document that substantiates the full claim and is not exclusive primary guidance | Partially supported, count 1, not publish-ready |
| NIST-named claim substantiated by both `www.nist.gov` and `airc.nist.gov` | Primary-source supported, `publisher:nist`, count 1, not publish-ready |
| Microsoft-named claim substantiated by Learn and Support | Primary-source supported, `publisher:microsoft`, count 1, not publish-ready |
| Fixture T-SAME-ORG | Partially supported, `publisher:microsoft`, count 1, method `single-source-supported`, not publish-ready |
| Power Platform availability claim that does not say “Microsoft” or “Copilot” | Exclusive to `microsoft`, count 1, primary-source supported, method `single-source-supported`, not publish-ready |
| Two paths and tracking variants of one URL | One document, count 1 |
| Fixture T-TWO-WORKS | Independently corroborated, count 2, method `exact`. Article publish-ready only when every other section 11 invariant also holds |
| Fixture T-NARROW | Partially supported, `publisher:microsoft`, count 1, method `single-source-supported`, not publish-ready |
| Fixture T-JOINT | Primary-source supported, one work identity, count 1, method `single-source-supported`, not publish-ready |
| Fixture T-JOINT-PLUS-SECOND-WORK | Independently corroborated, count 2, method `exact`. Article publish-ready only when every other section 11 invariant also holds |
| Primary scripture claim plus a commentary page | Commentary ineligible. A substantiating exclusive scripture passage is primary-source supported, count 1, not publish-ready |
| “According to” one listed official-guidance source whose page substantiates the full claim | Primary-source supported, exclusive to that URL, count 1 |
| “According to” two matching sources | Unsupported until attribution is unique |
| Material negation across two allowed sources | Disputed, score 0, status `unverified`, method `disputed`, even if the publisher count is 2 |
| Narrower true statement beside a broader claim | `does-not-address` for the narrower passage. No dispute from that pair alone. |
| Fixture T-RESOLVED | Primary-source supported, `publisher:microsoft`, count 1, method `single-source-supported`, not publish-ready. The resolution for `disputeId` D1 remains visible |
| Fixture T-NEW-SPAN | Disputed, score 0, status `unverified`, method `disputed`, not publish-ready. The resolution for D1 does not cover D2 |
| Human resolution after a covered passage checksum changes | That dispute returns to unresolved. The claim stays disputed |
| Versioned audit with `disputes` omitted | Publication guard fails closed |
| Versioned audit with `disputes: []` | No recorded dispute |
| Primary-source confirmation note present | State unchanged. Content fingerprint unchanged. Recommendation not publish-ready. |
| Article text edited during review | Content fingerprint changes and the current audit is invalidated |
| Theme source count 2 while each claim has count 1 | Recommendation not publish-ready |
| Unscored eligible factual claim | Recommendation leaves publish-ready |
| Corroborated claim with no substantiating URL | Recommendation leaves publish-ready |
| Missing, null, or malformed fact metadata on a versioned audit | Publication guard fails closed |
| Consensus below 80, source quality below 70, or average verification below 80 | Not publish-ready |
| Baseline audit without this specification version | Judged by the baseline gate only |
| Legacy `factVerificationEngine` or publication-gate JSON | Cannot authorise article publication |
| Unknown hosts `a.example.com` and `b.example.com` | Two identities |
| Fetch failure | Stored as not acquired, with no invented passage |
| Audit fingerprint or association mismatch | Not a current audit |
| Material factual sentence removed from scoring by an authorial pattern | Conformance test fails |

### Fixture T-SAME-ORG

- Claim: “Some collaboration software can produce a written summary of a meeting.”
- Passages: the Learn page and the Support page each contain that full sentence.
- Publisher identities: both hosts are `publisher:microsoft`.
- Identity count: 1.
- Evidence state: partially supported. The claim names no vendor, product alias, scripture, or single issuing body, so Microsoft is not its exclusive primary source.
- Verification method: `single-source-supported`.
- Publication eligibility: not publish-ready.

### Fixture T-NARROW

- Claim: “Microsoft and Google both state that a person must review an AI-written draft before it is sent.”
- Microsoft passage: that full sentence.
- Google passage: “Gmail can suggest short replies.” This does not substantiate the full claim and is not counted.
- Publisher identities counted: `publisher:microsoft` only.
- Identity count: 1.
- Evidence state: partially supported.
- Verification method: `single-source-supported`.
- Publication eligibility: not publish-ready.

### Fixture T-RESOLVED

- Claim: “Microsoft’s documentation states that some Copilot features are not available in every region or language.”
- Passage L, `learn.microsoft.com`, checksum CL: states the full claim. Polarity `supports`.
- Passage S, `support.microsoft.com`, checksum CS: “A newly released Copilot feature may not appear in every language on the first day.” A machine candidate marks this `contradicts`. The human resolution says the passages do not address the same clause.
- Dispute D1 is `not-a-contradiction`, bound to D1, source-set fingerprint F, and checksums CL and CS. Those values still match. No other dispute record exists.
- Publisher identities counted: `publisher:microsoft`.
- Identity count: 1.
- Evidence state: primary-source supported.
- Verification method: `single-source-supported`.
- Publication eligibility: not publish-ready. The D1 resolution remains visible.

### Fixture T-NEW-SPAN

- Start from fixture T-RESOLVED, with the same listed URLs and the same valid D1 resolution.
- A new extracted span from `learn.microsoft.com` says “Copilot features are available in every region and language.”
- That span creates dispute D2. D2’s `disputeId` differs because its contradicting checksum differs. D1’s resolution does not apply to D2.
- Evidence state: disputed.
- Verification method: `disputed`.
- Verification score: 0. Compatibility status: `unverified`.
- Publication eligibility: not publish-ready.

### Fixture T-JOINT

- Claim: “The joint cybersecurity information sheet states that organisations should validate an AI system before using it.”
- One PDF names NSA, CISA, and ACSC and contains that full sentence. No second work is listed.
- Publisher identities: one work identity, the PDF hostname. The named issuers do not add identities.
- Identity count: 1.
- Evidence state: primary-source supported.
- Verification method: `single-source-supported`.
- Publication eligibility: not publish-ready.

### Fixture T-JOINT-PLUS-SECOND-WORK

- The T-JOINT claim and PDF remain.
- A separately authored NIST page contains the same full sentence.
- Publisher identities: the PDF’s one work identity and `publisher:nist`.
- Identity count: 2.
- Evidence state: independently corroborated.
- Verification method: `exact`.
- Publication eligibility: this claim does not fail the single-source or dispute rules. The article is publish-ready only when every other section 11 invariant also holds.

### Fixture T-TWO-WORKS

- Claim: “Official guidance and the NIST AI Risk Management Framework both say that AI risk decisions should be documented.”
- A `business.gov.au` page and a separate `nist.gov` page each contain that full sentence. They are independently authored works.
- Publisher identities: hostname `business.gov.au` and `publisher:nist`.
- Identity count: 2.
- Evidence state: independently corroborated.
- Verification method: `exact`.
- Publication eligibility: this claim does not fail the single-source or dispute rules. The article is publish-ready only when every other section 11 invariant also holds.

The existing editorial tests for named-publisher collapse, canonical URL equivalence, legacy-audit fail-closed behaviour, evidence completeness, and the 80 / 70 constants are the regression floor. Tests that currently expect two hostnames of one organisation to verify an unattributed claim must be updated in the implementation change, not silently weakened ahead of it.

## 15. Adoption sequence

This revision authorises none of the following. A later programme may proceed only in this order, with a separate approval for each step:

1. Adopt EV-REG-SPEC-1.0.0 in writing. That adoption closes OD-1 through OD-9 as proposed in section 16. It does not change code, confirm the governing article, or authorise an audit.
2. Add the section 14 tests against the current baseline, without weakening them. Update a baseline test only in the change that implements the stricter identity rule, and show the old and new expectation in that review.
3. Introduce persisted evidence-state and dispute fields as additive audit data. Old audits stay readable and stay on the baseline gate.
4. Route Prepare for Review and the article publication guard through the unified contract. Keep the numeric thresholds.
5. Make `factVerificationEngine` use section 6.3, or remove publication recommendations from its routes. Until then, label the publication-gate response non-authoritative for article eligibility.
6. Only after those steps, prepare a new audit for a specific article under the existing audit approval rule.

This document is step 0.

## 16. Proposed resolutions of OD-1 through OD-9

These are proposed resolutions for a later adoption approval. They are not adopted policy. The normative sections of this revision are written to match them, so that adoption would not reopen a contradiction. Revising this file does not close the decisions.

| ID | Decision | Proposed resolution | Eligibility effect after a future implementation |
|---|---|---|---|
| OD-1 | Registry change control | Publisher membership changes require a specification amendment. The first registry is the baseline nine publishers and their existing host families, plus the Power Platform alias in section 6.2. | Unchanged until a later amendment. |
| OD-2 | Unattributed same-organisation hosts | Two hostnames of one registry publisher are one identity for every claim shape, including unattributed claims. | Future versioned audits become stricter than the baseline hostname count. Stored baseline audits are not rewritten. |
| OD-3 | Joint documents | One document or registry-marked joint work contributes at most one corroboration identity, for attributed and unattributed claims. Naming multiple issuers, or listing multiple publishers on the same PDF, does not create independent corroboration. A second independently authored work is required. | One joint work cannot verify itself. Baseline stored audits are not rewritten. |
| OD-4 | First dispute detector | Human-recorded disputes come first. Machine output may only create an unresolved `machine-candidate`. | No eligibility change until disputes are implemented. An unresolved dispute can only block `publish-ready`. |
| OD-5 | Primary-source publication path | A primary-source-supported claim stays single-source. The article stays `review-required`. Confirmation cannot make it publish-ready. | Unchanged from the baseline single-source rule. |
| OD-6 | Hostname collapse outside the registry | An unknown host uses its full hostname with a leading `www.` removed. Unknown subdomains are not collapsed. Public-suffix and registrable-domain collapse are not used. | Matches the baseline hostname key for unknown hosts. |
| OD-7 | Authority table | The four baseline tables stay as they are. A later programme proposes one table without changing the 80 and 70 gates, and that table keys off the hostname. | Unchanged. |
| OD-8 | Legacy-engine retirement | Article publication ignores `factVerificationEngine` and the publication-gate JSON. Route removal waits for implementation step 5. Adopting this document does not change runtime behaviour. | Editorial eligibility unchanged. The legacy JSON cannot set it. |
| OD-9 | Governing article | Article `cmw0ln6wb000078ungn5f9lqk` is not rewritten, re-audited, or confirmed as part of adopting this document. | Unchanged. Status remains `review-required`. |

## 17. Conformance

An implementation conforms to EV-REG-SPEC-1.0.0 only after this specification has been adopted and sections 4 through 11 and 14 hold. A partial implementation must identify itself as non-conformant and must not emit article `publish-ready` under this specification version.

Adding or revising this file does not adopt the specification and does not authorise implementation.

## 18. Twelve review corrections

Milestone 3Q required twelve corrections. This revision addresses them as follows:

| Correction | Where it is resolved |
|---|---|
| 1. Keep proposed decisions distinct from adopted policy | Sections 2 and 16. Adoption would close the nine resolutions later. This revision does not. |
| 2. Require full-claim substantiation | Sections 3, 4.1, 5, and 8.4. Token overlap alone is unsupported. |
| 3. Give disputes priority | Section 4 evaluation order, sections 4.5, 5, and 7.3. |
| 4. Disputed compatibility fields | Section 8.2: score 0, status `unverified`, method `disputed`, including when the publisher count is 2. |
| 5. Official guidance is a primary-source class | Sections 3, 4.3, 6.3, and 12. |
| 6. Confirmation does not edit the article | Section 9 steps 4 and 5. An article save is a separate approval and invalidates the audit. |
| 7. Bind resolutions and require dispute metadata | Sections 7.2, 7.4, and 10.1. Expiry reopens the dispute. A missing array fails closed on a versioned audit. |
| 8. Preserve baseline audits | Sections 10.4 and 11. The new dispute and engine rows apply only to versioned audits. |
| 9. Full hostname for unknown publishers | Sections 6.1 and 16, OD-6. No registrable-domain collapse. |
| 10. One outcome per regression case | Section 14. The NIST case is primary-source supported, count 1. |
| 11. Adoption closes decisions and grants no implementation authority | Sections 2 and 15. |
| 12. Legacy publication-gate JSON is not article authorisation | Sections 6.4, 8.1, 11, and 16, OD-8. |

## 19. Document control

| Version | Date | Status | Change |
|---|---|---|---|
| 1.0.0 | 2026-11-14 | PROPOSED | Initial specification for Milestone 3P. Documentation only. |
| 1.0.0-3R | 2026-11-14 | PROPOSED | Milestone 3R revision. Incorporates the twelve 3Q corrections and records OD-1 through OD-9 as proposed resolutions. Not adopted. Baseline `d654d85c1583b1fe426d65052d991c3a5c967a14` unchanged. |
| 1.0.0-3T | 2026-11-14 | PROPOSED | Milestone 3T safety revision. Dispute resolutions retire only their own dispute identity. One joint work contributes one corroboration identity. Section 14 fixtures have one evidence state each. Not adopted. Baseline unchanged. |
