# EV-KOS Enterprise Beta Auth Evaluation

EB-1 evaluates authentication providers without integrating any of them.

## Provider Options

| Provider | Position |
| --- | --- |
| Clerk | Preferred candidate because of organization support and fast enterprise admin UX. |
| Auth.js / NextAuth | Viable candidate with strong framework alignment and more self-managed control. |
| Supabase Auth | Needs review because it may reshape data and tenant boundaries. |
| Custom session approach | Needs review because it carries the highest security burden. |

## Recommendation

Provider recommendation: `Clerk`

This is a planning recommendation only. No provider is installed or integrated.

## Required Before Implementation

- Data boundary review.
- Tenant claim mapping.
- Session lifetime policy.
- Role and permission mapping.
- Audit event model.
- Route guard enforcement plan.
