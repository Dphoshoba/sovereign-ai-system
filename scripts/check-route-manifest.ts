import * as fs from 'fs'
import * as path from 'path'

/**
 * Check Route Manifest Script
 * Validates that all expected Gamma routes exist
 * Usage: tsx scripts/check-route-manifest.ts
 */

interface Route {
  path: string
  exists: boolean
  type: 'page' | 'api' | 'unknown'
}

function checkRoute(routePath: string): Route {
  // Check for app/[domain]/page.tsx or app/[domain]/[id]/page.tsx
  const appPagePath = path.join(process.cwd(), 'app', routePath, 'page.tsx')
  const appDetailPath = path.join(
    process.cwd(),
    'app',
    routePath,
    '[id]',
    'page.tsx'
  )
  const apiPath = path.join(process.cwd(), 'app', 'api', routePath, 'route.ts')

  if (fs.existsSync(appPagePath)) {
    return { path: routePath, exists: true, type: 'page' }
  }
  if (fs.existsSync(appDetailPath)) {
    return { path: routePath, exists: true, type: 'page' }
  }
  if (fs.existsSync(apiPath)) {
    return { path: routePath, exists: true, type: 'api' }
  }

  return { path: routePath, exists: false, type: 'unknown' }
}

function main() {
  console.log('📋 Checking route manifest...\n')

  const expectedRoutes = [
    'gamma-cloud',
    'gamma-os',
    'mission-control',
    'enterprise-monitor',
    'tenant',
    'organization',
    'subscription',
    'licensing',
    'module-marketplace',
    'api-gateway',
  ]

  const results = expectedRoutes.map((route) => checkRoute(route))

  let allPresent = true
  results.forEach((result) => {
    const status = result.exists ? '✅' : '❌'
    console.log(`${status} /${result.path} (${result.type})`)
    if (!result.exists) allPresent = false
  })

  console.log()

  if (allPresent) {
    console.log(`✅ PASS — All ${expectedRoutes.length} core routes present\n`)
    process.exit(0)
  } else {
    const missing = results.filter((r) => !r.exists)
    console.log(`❌ FAIL — ${missing.length} routes missing:\n`)
    missing.forEach((r) => {
      console.log(`  - /${r.path}`)
    })
    console.log()
    process.exit(1)
  }
}

main()
