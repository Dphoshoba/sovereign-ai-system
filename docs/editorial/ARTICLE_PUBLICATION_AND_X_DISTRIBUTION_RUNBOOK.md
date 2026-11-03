# Article publication and X distribution

Operational baseline for one Echoes & Visions article: research, editorial approval, featured image, publication, social approval, X publishing, and public verification.

This runbook records how that path works in commit `99aaacb13f064864b684c0d614377d1b78201812`. It does not authorise another publish, deploy, migration, audit refresh, or retry.

Mechanisms below were read from that commit. The publication record in the baseline was established by this programme and is not re-checked by editing this file.

## Baseline

| Item | Record |
| --- | --- |
| Article | How to Start Using AI in Your Small Business Without Losing Human Control |
| Public article | https://www.echoesandvisions.com/blog/how-to-start-using-ai-in-your-small-business-without-losing-human-control |
| X post | https://x.com/GmDavidoshoba/status/2117549724588761389 |
| Release commit | `99aaacb13f064864b684c0d614377d1b78201812` on branch `gamma` |
| Production deployment | `dpl_C5evC8HRAVhkADSEb1EqkkPWb8j6` |
| Vercel project | `sovereign-ai-executive` |
| Aliases | https://www.echoesandvisions.com and https://sovereign-ai-executive.vercel.app |
| Approved X account | David O George, @GmDavidoshoba, user id `2330006420` |

That deployment is already live. Do not redeploy it to repeat this publication.

## Public article URL

The only public article route is `app/blog/[slug]/page.tsx`. It loads an article whose status is `published` and sets the canonical path to `/blog/${slug}`.

The X publisher uses the same shape, with a fixed origin:

`https://www.echoesandvisions.com/blog/${slug}`

Category-prefixed paths such as `/blog/ai-automation/[slug]` and `/blog/ai-tools/[slug]` are not public routes. They are not article URLs. Do not invent one.

## Authentication

Social mutations and X publish call `requirePublishingEditor()` before any database write or external call. Covered mutations include generate, regenerate, update, approve, reject, delete, and the platform publish routes.

An unauthenticated request receives HTTP 401 with code `AUTHENTICATION_REQUIRED`. An authenticated account whose role is `viewer`, `reviewer`, or `anon` receives HTTP 403 with code `FORBIDDEN`.

Article approval, featured-image prompt approval, featured-image generation, and package publish use `requireEditorAuth()`: a signed-in user, without the publishing-role exclusion above. Each of those actions still needs its own human authorisation. Approval of one step is not approval of the next.

## 1. Research and evidence verification

Prepare the live article, not a separate Markdown file. `POST /api/articles/prepare-for-review` accepts only `draft`, `review`, or `review-required`. It requires a signed-in user. Approved, scheduled, and published articles are left unchanged.

The preparation writes the research audit and returns the article to `review-required`. A later schedule or publish is allowed only when the current audit matches this content revision and is publish-ready:

- consensus score at least 80
- source quality score at least 70
- recommendation exactly `publish-ready`

A stale audit is not publishable. Do not restore approval by writing approval fields, and do not lower the gate. If audited article fields change while the article is `approved` or `scheduled`, the lifecycle returns it to `review-required` and clears the stored editorial, quality, and SEO scores. Published article content cannot be edited in place.

## 2. Editorial review and approval

Human review happens while the article is `review-required` and the current audit is present. `POST /api/articles/approve` is the approval transition. It records the reviewer on the article and an `approved` review note.

Approval does not publish the article and does not send a social post.

## 3. Featured-image prompt approval and generation

Featured-image work starts only after the article is `approved` and still has a current audit.

1. A human approves the prompt text with `POST /api/articles/featured-image-prompt`. The approval is stored as a `featured-image-prompt-approved` review note bound to the article and the current content fingerprint.
2. Generation is a separate call, `POST /api/ai/generate-featured-image`. It runs only when that approved prompt is current. A missing, stale, malformed, or ambiguous prompt leaves the article unchanged.

A draft cannot approve or generate a featured image. Replacing an already approved current prompt requires an explicit replacement. Do not generate from an unapproved prompt.

## 4. Article publication

Publish only an `approved` article, or a `scheduled` article that is due, when the publication guard and the publish-ready audit both pass.

`POST /api/articles/publish-package` performs that article transition. On success it also:

- creates social drafts when the article has none
- marks social posts that were already `review-required` before the call as `approved`
- marks linked newsletters that were `review-required` as `approved`

Those side effects are not X publication. New drafts from this call stay `review-required`. Package publish must not be treated as approval to post on X.

The public page is available at `/blog/${slug}` only after status is `published`.

## 5. Social draft review and approval

Generated drafts do not include the canonical article URL. Both `lib/social/auto-generate-social.ts` and `POST /api/social/generate` store the model text only. The operator adds the exact canonical URL to the draft and reviews the wording before approval.

`POST /api/social/update` can change draft text. `POST /api/social/approve` sets status to `approved` and does not rewrite the text. Reject, regenerate, and delete are separate publishing-editor actions.

X publish sends the stored text unchanged. If the approved text is wrong, stop. Do not rely on the publisher to correct it.

For an article-linked post, the stored text must already contain this exact URL:

`https://www.echoesandvisions.com/blog/${slug}`

Any other `http` or `https` link whose path starts with `/blog/` and is not that URL is rejected as `incorrect_article_link`. A missing canonical URL is rejected as `missing_canonical_url`.

Weighted length counts each URL as 23 characters and must be from 1 to 280. The publisher does not trim or rewrite the post to make it fit.

## 6. Secure X publishing

`POST /api/social/publish/twitter` is the X publish route. It requires a publishing editor, then a `postId`. The post must be platform `twitter`, status `approved`, and not already published. A linked article must already be `published`.

Before the post is claimed or sent, the route checks the X credentials in the target environment with a read-only identity call (`v2.me`). The account id must be `2330006420`. If the client cannot be created, the identity call fails, or the id does not match, the call fails closed (`x_account_unverified` or `x_account_mismatch`) and does not tweet. Do not record tokens, secrets, or account credentials in notes or events.

A successful pre-check claims the row by setting status to `publishing` and records `social_publish_claimed`. The stored content is then sent as written.

No-retry rule. If the X result is uncertain, leave the row in `publishing`, record operational event `social_publish_uncertain`, and do not automatically retry. Uncertain cases are a network failure, HTTP 5xx, 408, 409, 425, 429, a missing tweet id, or a database failure after X responds. A definite X 4xx other than 408, 409, 425, and 429 releases the claim back to `approved` and records `social_publish_failed`. If that release itself fails, the outcome stays uncertain.

A second request that sees `publishing` returns `publish_in_progress` and must not call X. An uncertain outcome needs human review of the operational event and the live X account. Review is not a retry.

## 7. Verification

After a definite success, confirm both public surfaces with read-only checks:

- The article responds at `https://www.echoesandvisions.com/blog/${slug}` and is the published piece. Do not use a category-prefixed URL.
- The X post is the status URL for the returned tweet id. For this baseline, that URL is https://x.com/GmDavidoshoba/status/2117549724588761389.

The social row for a stored success is `published` and keeps the tweet id in `externalId`. The success event type is `social_publish`.

If the outcome is uncertain, stop. Do not send the post again, do not call a mutation route to confirm, and do not run a migration.

## Remaining limitations

These are current boundaries of this baseline. They are not new work items.

- `scripts/migrate-social-status.ts` is a local operator script, not an HTTP route. It updates social rows through the database. Do not run it against production as part of publishing.
- `POST /api/debug/migrate-social-status` and `GET /api/debug/social-status` are removed. They are not operator tools.
- OAuth routes were outside this security release. Commit `99aaacb` includes LinkedIn OAuth under `app/api/social/oauth/linkedin/`, and those handlers do not call `requirePublishingEditor`. X publishing does not use them.
- Generated social drafts do not automatically include `https://www.echoesandvisions.com/blog/${slug}`.
- Facebook publish still builds its link as `${NEXT_PUBLIC_APP_URL}/blog/ai-tools/${slug}` in `app/api/social/publish/facebook/route.ts`. That category prefix is not a public article route. This runbook does not use that URL for X.
- An uncertain X outcome stays in `publishing` until a person reviews it. The application will not retry it.
