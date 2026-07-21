export interface GovernanceRule {
  id: string;
  category: 'permission' | 'audit' | 'security' | 'compliance' | 'policy' | 'risk';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'advisory';
  enforcementLevel: 'strict' | 'advisory' | 'monitor_only';
}

export interface GovernanceFramework {
  rules: GovernanceRule[];
  activeRules: number;
  strictEnforcements: number;
  categories: string[];
  complianceScore: number;
  generatedAt: number;
}

export function buildGovernanceFramework(context: {
  policyCount: number;
  riskCount: number;
}): GovernanceFramework {
  const rules: GovernanceRule[] = [
    { id: 'g-permission-001', category: 'permission', description: 'All executive actions require role-based authorization', severity: 'critical', status: 'active', enforcementLevel: 'strict' },
    { id: 'g-audit-001', category: 'audit', description: 'Every autonomous action must be logged with full traceability', severity: 'critical', status: 'active', enforcementLevel: 'strict' },
    { id: 'g-security-001', category: 'security', description: 'Production data isolation enforced at query level', severity: 'critical', status: 'active', enforcementLevel: 'strict' },
    { id: 'g-compliance-001', category: 'compliance', description: 'Executive briefings must exclude seeded/demo data', severity: 'critical', status: 'active', enforcementLevel: 'strict' },
    { id: 'g-policy-001', category: 'policy', description: 'No autonomous execution without explicit approval', severity: 'high', status: 'active', enforcementLevel: 'strict' },
    { id: 'g-risk-001', category: 'risk', description: 'Risk severity must be assessed before action generation', severity: 'medium', status: 'active', enforcementLevel: 'advisory' },
  ];
  return {
    rules,
    activeRules: rules.length,
    strictEnforcements: rules.filter(r => r.enforcementLevel === 'strict').length,
    categories: [...new Set(rules.map(r => r.category))],
    complianceScore: Math.min(100, 80 + context.riskCount * 2),
    generatedAt: Date.now(),
  };
}
