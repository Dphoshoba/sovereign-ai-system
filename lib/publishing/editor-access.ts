const EDITORIAL_ROLES = new Set(["admin", "editor"])

function roleName(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null
}

export function canPublishAsEditor(user: {
  id?: string | null
  email?: string | null
  role?: string | null
  app_metadata?: unknown
  user_metadata?: unknown
}): boolean {
  if (!user.id && !user.email) return false
  const metadata =
    user.app_metadata && typeof user.app_metadata === "object"
      ? (user.app_metadata as { role?: unknown })
      : null
  const metadataRole = roleName(metadata?.role)
  return metadataRole !== null && EDITORIAL_ROLES.has(metadataRole)
}
