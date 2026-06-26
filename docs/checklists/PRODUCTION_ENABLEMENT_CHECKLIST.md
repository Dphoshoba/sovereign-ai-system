# Production Enablement Checklist

## Provider Selection

- [ ] Approve auth provider.
- [ ] Define provider-to-operator identity mapping.
- [ ] Keep EV-KOS authorization provider-neutral.
- [ ] Do not enable sessions or JWTs until separately approved.

## Authorization

- [ ] Add identity adapter plan.
- [ ] Add role guard plan.
- [ ] Add permission guard plan.
- [ ] Add approval handoff guard plan.
- [ ] Add negative tests before blocking enforcement.

## Rate Limiting

- [ ] Define route policy map.
- [ ] Add report-only middleware plan.
- [ ] Select counter storage.
- [ ] Add local dev fallback plan.
- [ ] Add exceeded-limit negative tests.

## Telemetry

- [ ] Select error monitoring provider.
- [ ] Define structured log fields.
- [ ] Define redaction policy.
- [ ] Define retention policy.
- [ ] Add guardrail event priorities.

## Startup Gate

- [ ] Validate required env list.
- [ ] Define production boot behavior.
- [ ] Define preview/staging behavior.
- [ ] Define local dev behavior.
- [ ] Keep enforcement disabled until approved.

## Safety

- [ ] No execution.
- [ ] No publishing.
- [ ] No OpenAI.
- [ ] No graph writes/deletes.
- [ ] No schema changes.
- [ ] No migrations.
