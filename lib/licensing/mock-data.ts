import type { LicenseWorkspace } from "./types"

const FIXED_TIMESTAMP = 1751990400000

export const LICENSE_ASSETS: LicenseWorkspace = {
  licenses: [
    {
      id: "lic-001",
      key: "ENT-GAMMA-2026-ALPHA-001",
      type: "enterprise",
      seats: 500,
      expiryDate: "2027-07-08",
      offlineValidation: true,
      status: "active",
      issuedAt: FIXED_TIMESTAMP,
    },
    {
      id: "lic-002",
      key: "GOV-GAMMA-2026-BETA-002",
      type: "government",
      seats: 2000,
      expiryDate: "2028-07-08",
      offlineValidation: true,
      status: "active",
      issuedAt: FIXED_TIMESTAMP,
    },
    {
      id: "lic-003",
      key: "PRO-GAMMA-2026-GAMMA-003",
      type: "professional",
      seats: 50,
      expiryDate: "2027-01-08",
      offlineValidation: false,
      status: "active",
      issuedAt: FIXED_TIMESTAMP,
    },
  ],
  metrics: {
    totalLicenses: 3,
    activeLicenses: 3,
    totalSeats: 2550,
    usedSeats: 1840,
    healthScore: 98,
  },
}
