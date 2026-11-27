import * as fs from 'fs'
import * as path from 'path'

/**
 * Check Determinism Script
 * Scans Gamma files for forbidden runtime operations that break determinism
 * Usage: tsx scripts/check-determinism.ts
 */

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

interface Violation {
  file: string
  line: number
  pattern: string
  content: string
}

function scanDirectory(dir: string): Violation[] {
  const violations: Violation[] = []

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) return

    const items = fs.readdirSync(currentPath)

    items.forEach((item) => {
      const fullPath = path.join(currentPath, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          const lines = content.split('\n')

          lines.forEach((line, lineNum) => {
            forbiddenPatterns.forEach(({ pattern, name }) => {
              if (pattern.test(line)) {
                violations.push({
                  file: fullPath,
                  line: lineNum + 1,
                  pattern: name,
                  content: line.trim(),
                })
              }
            })
          })
        } catch (e) {
          // Ignore read errors
        }
      }
    })
  }

  walk(dir)
  return violations
}

function main() {
  console.log('🔍 Checking determinism constraints...\n')

  const libDir = path.join(process.cwd(), 'lib', 'gamma')
  const appDir = path.join(process.cwd(), 'app')
  const scriptsDir = path.join(process.cwd(), 'scripts')

  const libViolations = scanDirectory(libDir)
  const appViolations = scanDirectory(appDir)
  const scriptViolations = scanDirectory(scriptsDir)

  const allViolations = [...libViolations, ...appViolations, ...scriptViolations]

  if (allViolations.length === 0) {
    console.log('✅ PASS — No forbidden runtime operations detected\n')
    process.exit(0)
  }

  // Filter critical violations (in lib/gamma, prefer determinism)
  const criticalViolations = libViolations.filter(
    (v) =>
      !v.file.includes('node_modules') &&
      !v.file.includes('.next')
  )

  if (criticalViolations.length > 0) {
    console.log('❌ FAIL — Determinism violations in critical paths:\n')
    criticalViolations.forEach((v) => {
      const relative = path.relative(process.cwd(), v.file)
      console.log(
        `  ${relative}:${v.line} - ${v.pattern}`
      )
      console.log(`    ${v.content}`)
    })
    console.log()
    process.exit(1)
  }

  // Non-critical violations (acceptable legacy code)
  if (allViolations.length > 0) {
    console.log('⚠️  WARNING — Non-critical violations detected (legacy code):\n')
    allViolations.slice(0, 10).forEach((v) => {
      const relative = path.relative(process.cwd(), v.file)
      console.log(`  ${relative}:${v.line} - ${v.pattern}`)
    })
    if (allViolations.length > 10) {
      console.log(`  ... and ${allViolations.length - 10} more`)
    }
    console.log(
      '\n✅ PASS — No critical violations; acceptable legacy code found\n'
    )
    process.exit(0)
  }
}

main()
