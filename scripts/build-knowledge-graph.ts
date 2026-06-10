import "dotenv/config"
import { buildExecutiveKnowledgeGraph } from "@/lib/executive/knowledge-graph"

async function main() {
  const result = await buildExecutiveKnowledgeGraph()

  console.log("Knowledge Graph Built")
  console.log(result)
}

main()
  .catch(console.error)
  .finally(() => process.exit())
