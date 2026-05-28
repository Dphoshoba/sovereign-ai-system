import cron from "node-cron"

export function persistentSchedulerAgent() {
  cron.schedule("0 */6 * * *", async () => {
    console.log("Autonomous Director waking up...")

    try {
      await fetch("http://localhost:3000/api/agents/content-generation-loop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          niche: "AI + Faith",
          audience: "faith-tech creators",
        }),
      })

      console.log("Autonomous generation cycle completed.")
    } catch (error) {
      console.error("Persistent scheduler failed:", error)
    }
  })

  console.log("Persistent autonomous scheduler started.")
}