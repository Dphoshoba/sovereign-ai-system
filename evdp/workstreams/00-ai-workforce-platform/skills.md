# Workstream B — Skills & Capability Registry

## Objective

Every AI worker owns explicit, versioned skills that are registered, discoverable, and reusable across offices. Skills enable task routing, agent selection, and capability planning.

## Skill Model

```yaml
Skill:
  skillId: "SKILL-RESEARCH-001"
  name: "Market Research"
  category: "Research"
  version: "1.0.0"
  description: "Conduct systematic market research using defined methodologies"
  requiresApproval: false
  relatedSkills: [ "SKILL-ANALYSIS-001", "SKILL-WRITING-001" ]

AgentSkillAssignment:
  agentId: "EO-001"
  skillId: "SKILL-RESEARCH-001"
  proficiency: 0.85          # 0.0 – 1.0
  assignedAt: 1710400000000
  expiresAt: null
```

## Skill Categories

| Category | Example Skills |
|---|---|
| Research | Market research, literature review, competitive analysis |
| Planning | Strategic planning, resource planning, scenario analysis |
| Writing | Content writing, technical writing, copy editing |
| Scheduling | Calendar management, timeline planning, dependency mapping |
| Analysis | Data analysis, trend analysis, root cause analysis |
| Reasoning | Decision support, recommendation generation, risk assessment |
| Summarization | Document summarization, briefing generation, meeting notes |
| Communication | Report writing, presentation creation, stakeholder updates |
| Decision Support | Option analysis, trade-off evaluation, recommendation ranking |
| Governance | Policy evaluation, compliance checking, audit support |

## Governance Policies

| Policy | Rule | Enforcement |
|---|---|---|
| WFS-001 | Skills must be registered before assignment to agents | Platform assignment validation |
| WFS-002 | Skills are versioned; assignment references a specific version | Skill registry versioning |
| WFS-003 | Skills requiring approval cannot be used without authorization | Gamma OS Policy Engine |
| WFS-004 | Agent skill assignments expire after defined period unless renewed | Platform expiry enforcement |
