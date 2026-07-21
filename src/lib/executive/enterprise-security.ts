export interface SecurityCapability {
  name: string;
  category: string;
  status: 'enforced' | 'configured' | 'advisory';
}

export interface EnterpriseSecurity {
  capabilities: SecurityCapability[];
  enforcedCount: number;
  totalCount: number;
  securityScore: number;
  generatedAt: number;
}

export function buildSecurityReport(context: {
  governancePassing: boolean;
}): EnterpriseSecurity {
  const caps: SecurityCapability[] = [
    { name: 'RBAC', category: 'authentication', status: 'configured' },
    { name: 'Audit Trail', category: 'compliance', status: 'enforced' },
    { name: 'Production Data Isolation', category: 'governance', status: 'enforced' },
    { name: 'Secrets Management', category: 'infrastructure', status: 'configured' },
    { name: 'Zero Trust', category: 'architecture', status: 'advisory' },
    { name: 'Encryption', category: 'data', status: 'configured' },
  ];
  return {
    capabilities: caps,
    enforcedCount: caps.filter(c => c.status === 'enforced').length,
    totalCount: caps.length,
    securityScore: context.governancePassing ? 80 : 50,
    generatedAt: Date.now(),
  };
}
