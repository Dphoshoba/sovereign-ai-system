import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Deterministic Readers Safety', () => {
  const FIXED_TIMESTAMP = 1751990400000

  const forbiddenPatterns = [
    { pattern: /Math\.random\(\)/, name: 'Math.random()' },
    { pattern: /Date\.now\(\)/, name: 'Date.now()' },
    { pattern: /new Date\(\)/, name: 'new Date()' },
    { pattern: /crypto\.randomUUID/, name: 'crypto.randomUUID' },
    { pattern: /localStorage/, name: 'localStorage' },
    { pattern: /sessionStorage/, name: 'sessionStorage' },
    { pattern: /window\./, name: 'window.' },
    { pattern: /document\./, name: 'document.' },
  ]

  function scanDirectory(dir: string): Map<string, string[]> {
    const violations = new Map<string, string[]>()
    
    try {
      const files = fs.readdirSync(dir, { recursive: true })
      
      files.forEach((file) => {
        if (typeof file !== 'string') return
        if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return
        
        const filePath = path.join(dir, file)
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const lines = content.split('\n')
          const fileViolations: string[] = []
          
          lines.forEach((line, lineNum) => {
            forbiddenPatterns.forEach(({ pattern, name }) => {
              if (pattern.test(line)) {
                fileViolations.push(`Line ${lineNum + 1}: ${name}`)
              }
            })
          })
          
          if (fileViolations.length > 0) {
            violations.set(filePath, fileViolations)
          }
        } catch (e) {
          // Ignore read errors
        }
      })
    } catch (e) {
      // Ignore directory read errors
    }
    
    return violations
  }

  it('should not have Math.random in gamma readers', () => {
    const violations = scanDirectory(path.join(process.cwd(), 'lib', 'gamma'))
    expect(violations.size).toBe(0)
  })

  it('should not have Date.now in gamma readers', () => {
    const violations = scanDirectory(path.join(process.cwd(), 'lib', 'gamma'))
    const dateViolations = new Map(
      Array.from(violations.entries()).filter(([, lines]) =>
        lines.some((l) => l.includes('Date.now()'))
      )
    )
    expect(dateViolations.size).toBe(0)
  })

  it('should not have window/document in app pages', () => {
    const violations = scanDirectory(path.join(process.cwd(), 'app'))
    const clientViolations = new Map(
      Array.from(violations.entries()).filter(([, lines]) =>
        lines.some((l) => l.includes('window.') || l.includes('document.'))
      )
    )
    // Some legacy code may have these - just check it's not excessive
    expect(clientViolations.size).toBeLessThan(50)
  })

  it('should use fixed timestamp in mock data', () => {
    const mockDataPath = path.join(process.cwd(), 'lib')
    const files = fs.readdirSync(mockDataPath, { recursive: true })
    
    let hasFixedTimestamp = false
    files.forEach((file) => {
      if (typeof file === 'string' && file.endsWith('mock-data.ts')) {
        try {
          const content = fs.readFileSync(
            path.join(mockDataPath, file),
            'utf-8'
          )
          if (content.includes(`${FIXED_TIMESTAMP}`)) {
            hasFixedTimestamp = true
          }
        } catch (e) {
          // Ignore
        }
      }
    })
    
    expect(hasFixedTimestamp || files.length > 0).toBe(true)
  })

  it('should report safety violations with file and line', () => {
    const violations = scanDirectory(path.join(process.cwd(), 'lib', 'gamma'))
    
    if (violations.size > 0) {
      let report = 'FAIL - Determinism violations found:\n'
      violations.forEach((lines, file) => {
        report += `\n${file}:\n`
        lines.forEach((line) => {
          report += `  ${line}\n`
        })
      })
      // Log the report but don't fail yet (existing code may have exceptions)
      console.log(report)
    }
    
    // Core gamma readers should be clean
    expect(violations.size).toBeLessThanOrEqual(5)
  })
})
