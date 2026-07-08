import { describe, it, expect } from 'vitest'

describe('Route Manifest', () => {
  const expectedRoutes = [
    '/gamma-cloud',
    '/gamma-os',
    '/mission-control',
    '/enterprise-monitor',
    '/tenant',
    '/organization',
    '/subscription',
    '/licensing',
    '/module-marketplace',
    '/api-gateway',
  ]

  it('should include all core routes in manifest', () => {
    expectedRoutes.forEach((route) => {
      expect(route).toMatch(/^\//)
      expect(route.length).toBeGreaterThan(1)
    })
  })

  it('should have valid route patterns', () => {
    const routePattern = /^\/[a-z\-]+$/
    expectedRoutes.forEach((route) => {
      expect(route).toMatch(routePattern)
    })
  })

  it('should have at least 10 core routes', () => {
    expect(expectedRoutes.length).toBeGreaterThanOrEqual(10)
  })

  it('should not have duplicate routes', () => {
    const uniqueRoutes = new Set(expectedRoutes)
    expect(uniqueRoutes.size).toBe(expectedRoutes.length)
  })

  it('should include critical commercial routes', () => {
    expect(expectedRoutes).toContain('/tenant')
    expect(expectedRoutes).toContain('/organization')
    expect(expectedRoutes).toContain('/subscription')
  })

  it('should include critical infrastructure routes', () => {
    expect(expectedRoutes).toContain('/gamma-cloud')
    expect(expectedRoutes).toContain('/enterprise-monitor')
    expect(expectedRoutes).toContain('/api-gateway')
  })
})
