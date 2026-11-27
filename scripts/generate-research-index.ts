import { getResearchRegistry } from "../lib/gamma/research-registry"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Build-time script to generate research registry index
 * Creates gamma/research/index.json with all discovered missions
 * Gamma Preview Mode: No persistence, no external writes
 */
async function generateResearchIndex() {
  try {
    console.log("[Build] Generating research mission registry index...")

    // Get all missions using the registry
    const registry = await getResearchRegistry()

    // Create output directory if it doesn't exist
    const outputDir = join(process.cwd(), "gamma", "research")
    mkdirSync(outputDir, { recursive: true })

    // Write index file
    const indexPath = join(outputDir, "index.json")
    const indexContent = {
      missions: registry.missions,
      generated: registry.generated.toISOString(),
      count: registry.count,
      preview: true,
      readonly: true,
    }

    writeFileSync(indexPath, JSON.stringify(indexContent, null, 2))

    console.log(`[Build] ✓ Research registry written to ${indexPath}`)
    console.log(`[Build] ✓ ${registry.count} missions discovered`)
    registry.missions.forEach((m) => {
      console.log(`[Build]   - ${m.slug}: ${m.title}`)
    })

    return true
  } catch (error) {
    console.error("[Build] Failed to generate research index:", error)
    // Don't fail the build, just warn
    return false
  }
}

generateResearchIndex()
  .then((success) => {
    process.exit(success ? 0 : 0) // Exit 0 regardless to not break build
  })
  .catch((error) => {
    console.error("[Build] Unexpected error:", error)
    process.exit(0) // Don't fail build
  })
