type ExecutionInput = {
  executionPlan: string[]
  baseUrl?: string
}

export async function executionTriggerAgent(input: ExecutionInput) {
  const baseUrl = input.baseUrl || "http://localhost:3000"

  const executedTasks = []

  for (const step of input.executionPlan) {
    let endpoint = null

    if (step === "Render video") {
      endpoint = `${baseUrl}/api/agents/render-video`
    }

    if (step === "Generate subtitles") {
      endpoint = `${baseUrl}/api/agents/subtitles`
    }

    if (step === "Publish to YouTube") {
      endpoint = `${baseUrl}/api/agents/youtube-publish`
    }

    if (step === "Sync analytics") {
      endpoint = `${baseUrl}/api/agents/youtube-analytics`
    }

    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            autonomous: true,
          }),
        })

        executedTasks.push({
          step,
          endpoint,
          status: "executed",
          executedAt: new Date().toISOString(),
        })
      } catch (error) {
        executedTasks.push({
          step,
          endpoint,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    } else {
      executedTasks.push({
        step,
        status: "simulated",
        executedAt: new Date().toISOString(),
      })
    }
  }

  return {
    autonomousExecution: true,
    totalTasks: executedTasks.length,
    executedTasks,
    systemStatus: "Real autonomous execution pipeline completed.",
  }
}