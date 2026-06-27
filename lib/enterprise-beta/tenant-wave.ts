export type TenantWave = {
  id: string
  wave: "wave-0-internal" | "wave-1-single-tenant" | "wave-2-limited-cluster"
  maxTenantCount: number
  required: boolean
  reportOnly: true
}

export function buildTenantWaves(): TenantWave[] {
  return [
    {
      id: "tenant-wave-0",
      wave: "wave-0-internal",
      maxTenantCount: 1,
      required: true,
      reportOnly: true,
    },
    {
      id: "tenant-wave-1",
      wave: "wave-1-single-tenant",
      maxTenantCount: 1,
      required: true,
      reportOnly: true,
    },
    {
      id: "tenant-wave-2",
      wave: "wave-2-limited-cluster",
      maxTenantCount: 3,
      required: true,
      reportOnly: true,
    },
  ]
}
