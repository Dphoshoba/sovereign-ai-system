# Gamma 2.0 Phase XVIII - Marketplace

## Objective
Phase XVIII makes Gamma installable and extensible without weakening governance.

Marketplace categories:

- Connector Marketplace
- Workflow Marketplace
- Mission Marketplace
- Prompt Marketplace
- Agent Marketplace
- Plugin Marketplace

## Canonical Contract
Implementation:

- `src/lib/gamma-2/marketplace.ts`

Validation:

- `tests/gamma-2/marketplace.test.ts`

## Marketplace Rule
Everything installable must be:

- versioned
- previewable
- governed
- auditable

## Boundary
Marketplace installation is preview-only until explicit approval. Artifacts that cannot be previewed or versioned are blocked.
