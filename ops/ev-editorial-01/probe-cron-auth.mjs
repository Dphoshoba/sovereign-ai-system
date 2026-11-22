import { readFileSync } from "node:fs"

function loadEnv() {
  const out = {}
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue
    const i = line.indexOf("=")
    if (i < 1) continue
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[line.slice(0, i).trim()] = v
  }
  return out
}

const env = loadEnv()
const key = env.CRON_SECRET || ""

async function hit(label, headers) {
  const res = await fetch(
    "https://www.echoesandvisions.com/api/cron/publish-scheduled",
    { method: "GET", headers },
  )
  const text = await res.text()
  return {
    label,
    status: res.status,
    preview: text.slice(0, 180),
  }
}

const results = [
  await hit("no_auth", {}),
  await hit("bearer", { Authorization: `Bearer ${key}` }),
]
console.log(JSON.stringify({ results }, null, 2))
