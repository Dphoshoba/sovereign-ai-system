# Connector Certification Template

This template defines the mandatory verification steps for any new connector added to the system.

## Stage 1: Read-Only Foundation
- [ ] API Integration (Basic Read)
- [ ] Deterministic Data Flow
- [ ] Production-Readiness Scanning
- [ ] Read-Only Certification Tag

## Stage 2: Governed Mutation Preparation
- [ ] **Stage 2A: Deterministic Previews**
  - [ ] Preview Generation Logic
  - [ ] Operation Coverage (Create/Update/Delete)
  - [ ] Determinism Verification
- [ ] **Stage 2B: Governance and Approval**
  - [ ] Policy Evaluation Engine
  - [ ] Approval Metadata Generation
  - [ ] Governance Decision Matrix
- [ ] **Stage 2C: Mutation Queue Preparation**
  - [ ] Idempotency Key Generation
  - [ ] Priority Mapping
  - [ ] Zero-Execution Guardrails
  - [ ] Metadata-Only Verification
- [ ] **Stage 2 Gates**
  - [ ] TypeScript Compilation
  - [ ] Connector-Specific Test Suite
  - [ ] Determinism Check
  - [ ] Full Repository Tests
  - [ ] Boundary & Security Scans

## Stage 3: Controlled Execution
- [ ] Execution Logic Implementation
- [ ] Error Handling & Retries
- [ ] Atomic Commit Verification
- [ ] Final Production Certification
