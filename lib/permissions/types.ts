export interface PermissionLevel {
  id: string
  name: string
  resources: string[]
  actions: string[]
}

export interface PermissionsMetrics {
  totalRoles: number
  totalUsers: number
  activeRoles: number
  permissionChecks: number
}

export interface PermissionsWorkspace {
  permissions: PermissionLevel[]
  metrics: PermissionsMetrics
}
