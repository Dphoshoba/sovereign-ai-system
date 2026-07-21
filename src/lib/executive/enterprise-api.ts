export interface ApiEndpoint {
  path: string;
  method: string;
  version: string;
  status: 'stable' | 'beta' | 'deprecated';
}

export interface ApiPlatform {
  endpoints: ApiEndpoint[];
  stableCount: number;
  totalCount: number;
  generatedAt: number;
}

export function buildApiPlatform(): ApiPlatform {
  const endpoints: ApiEndpoint[] = [
    { path: '/api/executive/briefing', method: 'GET', version: 'v1', status: 'stable' },
    { path: '/api/executive/forecast', method: 'GET', version: 'v1', status: 'stable' },
    { path: '/api/executive/goals/generate', method: 'POST', version: 'v1', status: 'stable' },
    { path: '/api/health', method: 'GET', version: 'v1', status: 'stable' },
    { path: '/api/executive/boardroom', method: 'GET', version: 'v1', status: 'beta' },
  ];
  return {
    endpoints,
    stableCount: endpoints.filter(e => e.status === 'stable').length,
    totalCount: endpoints.length,
    generatedAt: Date.now(),
  };
}
