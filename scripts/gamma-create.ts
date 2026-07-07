import { GAMMA_CREATE_COMMANDS } from "../lib/create/mock-data"

function main(): void {
  const args = process.argv.slice(2)
  const input = args.length > 0 ? args.join(" ").trim() : ""

  if (!input) {
    console.log("Usage: gamma:create <template>")
    console.log("Supported commands:")
    for (const item of GAMMA_CREATE_COMMANDS) {
      console.log(`- ${item.command}`)
    }
    process.exit(0)
  }

  const normalized = input.startsWith("gamma:create") ? input : `gamma:create ${input}`
  const match = GAMMA_CREATE_COMMANDS.find((item) => item.command === normalized)

  if (!match) {
    console.log(`Unsupported command: ${normalized}`)
    console.log("Supported commands:")
    for (const item of GAMMA_CREATE_COMMANDS) {
      console.log(`- ${item.command}`)
    }
    process.exit(1)
  }

  console.log("Gamma Create Preview")
  console.log(`Command: ${match.command}`)
  console.log(`Template: ${match.template}`)
  console.log(`Workspace Generation Score: ${match.workspaceGenerationScore}`)
  console.log("Mode: read-only deterministic preview")
}

main()
