export type LicenseType = "enterprise" | "professional" | "government" | "education"
export type LicenseStatus = "active" | "expired" | "revoked"

export type LicenseKey = {
  id: string
  key: string
  type: LicenseType
  seats: number
  expiryDate: string
  offlineValidation: boolean
  status: LicenseStatus
  issuedAt: number
}

export type LicenseMetrics = {
  totalLicenses: number
  activeLicenses: number
  totalSeats: number
  usedSeats: number
  healthScore: number
}

export type LicenseWorkspace = {
  licenses: LicenseKey[]
  metrics: LicenseMetrics
}
