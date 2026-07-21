export interface IntegrationStatus {
  name: string;
  category: string;
  status: 'certified' | 'configured' | 'not_configured';
  version?: string;
}

export interface IntegrationPlatform {
  integrations: IntegrationStatus[];
  certifiedCount: number;
  configuredCount: number;
  totalCount: number;
  generatedAt: number;
}

export function buildIntegrationPlatform(): IntegrationPlatform {
  const integrations: IntegrationStatus[] = [
    { name: 'Calendar', category: 'productivity', status: 'configured' },
    { name: 'Email', category: 'communication', status: 'certified', version: '1.0' },
    { name: 'GitHub', category: 'development', status: 'configured' },
    { name: 'Stripe', category: 'payments', status: 'configured' },
    { name: 'CRM', category: 'business', status: 'configured' },
    { name: 'Slack', category: 'communication', status: 'configured' },
    { name: 'Xero', category: 'finance', status: 'configured' },
  ];
  return {
    integrations,
    certifiedCount: integrations.filter(i => i.status === 'certified').length,
    configuredCount: integrations.filter(i => i.status !== 'not_configured').length,
    totalCount: integrations.length,
    generatedAt: Date.now(),
  };
}
