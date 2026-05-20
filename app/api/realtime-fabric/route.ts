import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const starterStreams = [
  {
    streamName: "sovereign-runtime",
    streamType: "core",
    description: "Central executive runtime events.",
  },
  {
    streamName: "governance",
    streamType: "control",
    description: "Approvals, risks, policies and constitutional decisions.",
  },
  {
    streamName: "execution",
    streamType: "operations",
    description: "Jobs, tasks, workflows and distributed execution events.",
  },
  {
    streamName: "intelligence",
    streamType: "cognition",
    description: "Strategic, cognitive, temporal, economic and world-model signals.",
  },
]

const starterWorkers = [
  {
    name: "Governance Worker",
    workerType: "governance",
    capabilities: ["approval-routing", "risk-escalation", "audit-log"],
  },
  {
    name: "Execution Worker",
    workerType: "execution",
    capabilities: ["workflow-jobs", "runtime-objectives", "operational-events"],
  },
  {
    name: "Intelligence Worker",
    workerType: "intelligence",
    capabilities: ["synthesis", "memory-routing", "strategic-signals"],
  },
]

async function seedFabric() {
  const streams = await prisma.realtimeEventStream.findMany()

  if (streams.length === 0) {
    await prisma.realtimeEventStream.createMany({
      data: starterStreams,
    })
  }

  const workers = await prisma.distributedWorkerNode.findMany()

  if (workers.length === 0) {
    await prisma.distributedWorkerNode.createMany({
      data: starterWorkers.map((worker) => ({
        ...worker,
        lastHeartbeat: new Date(),
      })),
    })
  }
}

export async function GET() {
  try {
    await seedFabric()

    const [streams, messages, workers, jobs, runs] = await Promise.all([
      prisma.realtimeEventStream.findMany({
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.realtimeEventMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.distributedWorkerNode.findMany({
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.distributedExecutionJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.realtimeFabricRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      streams,
      messages,
      workers,
      jobs,
      runs,
    })
  } catch (error) {
    console.error("Realtime fabric fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch realtime fabric" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await seedFabric()

    const [
      sovereignSnapshots,
      governanceRisks,
      approvals,
      infrastructureIncidents,
      retryJobs,
      operationalEvents,
      runtimeActions,
      tenantSnapshots,
      identitySessions,
    ] = await Promise.all([
      prisma.sovereignRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.executionAuthorizationRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.resilienceIncident.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.infrastructureRetryJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.sovereignRuntimeAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.tenantRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.identitySession.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Sovereign Real-Time Event Fabric and Distributed Execution Mesh for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Convert platform state into live event messages, execution jobs and worker routing. Keep high-risk actions governed. Return valid JSON only.",
      input:
        "Generate a realtime fabric run.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "eventHealth":82,
          "workerHealth":80,
          "queuePressure":35,
          "executionHealth":78,
          "findings":{
            "liveSignals":["..."],
            "queueRisks":["..."],
            "workerNeeds":["..."],
            "executionRoutes":["..."],
            "hardeningMoves":["..."]
          },
          "messages":[
            {
              "streamName":"sovereign-runtime|governance|execution|intelligence",
              "eventType":"runtime-signal|governance-alert|execution-job|intelligence-update|incident|tenant-event",
              "source":"...",
              "title":"...",
              "message":"...",
              "priority":"low|medium|high|critical",
              "payload":{}
            }
          ],
          "jobs":[
            {
              "jobType":"governance-review|execute-runtime-action|process-retry|create-operational-event|store-memory|tenant-sync",
              "title":"...",
              "targetLayer":"governance|runtime|infrastructure|memory|tenant|operations",
              "priority":"low|medium|high|critical",
              "assignedWorker":"Governance Worker|Execution Worker|Intelligence Worker",
              "payload":{}
            }
          ]
        }` +
        "\n\nSovereign Snapshots:\n" + JSON.stringify(sovereignSnapshots) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nExecution Authorization Requests:\n" + JSON.stringify(approvals) +
        "\n\nInfrastructure Incidents:\n" + JSON.stringify(infrastructureIncidents) +
        "\n\nRetry Jobs:\n" + JSON.stringify(retryJobs) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents) +
        "\n\nSovereign Runtime Actions:\n" + JSON.stringify(runtimeActions) +
        "\n\nTenant Snapshots:\n" + JSON.stringify(tenantSnapshots) +
        "\n\nIdentity Sessions:\n" + JSON.stringify(identitySessions),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.realtimeFabricRun.create({
      data: {
        title: parsed.title || "Realtime Fabric Run",
        summary: parsed.summary || null,
        eventHealth: parsed.eventHealth || 75,
        workerHealth: parsed.workerHealth || 75,
        queuePressure: parsed.queuePressure || 30,
        executionHealth: parsed.executionHealth || 75,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedMessages = []

    for (const item of parsed.messages || []) {
      const message = await prisma.realtimeEventMessage.create({
        data: {
          streamName: item.streamName || "sovereign-runtime",
          eventType: item.eventType || "runtime-signal",
          source: item.source || "realtime-fabric",
          title: item.title,
          message: item.message || null,
          priority: item.priority || "medium",
          payload: item.payload || {},
          status: "pending",
        },
      })

      savedMessages.push(message)
    }

    const savedJobs = []

    for (const item of parsed.jobs || []) {
      const job = await prisma.distributedExecutionJob.create({
        data: {
          jobType: item.jobType || "create-operational-event",
          title: item.title,
          targetLayer: item.targetLayer || "operations",
          priority: item.priority || "medium",
          assignedWorker: item.assignedWorker || null,
          payload: item.payload || {},
          status: "queued",
          scheduledAt: new Date(),
        },
      })

      savedJobs.push(job)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "realtime-fabric-run",
        source: "realtime-fabric",
        title: run.title,
        message: run.summary || null,
        severity:
          run.queuePressure >= 75
            ? "critical"
            : run.queuePressure >= 55
              ? "high"
              : "medium",
        entityType: "RealtimeFabricRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          messageCount: savedMessages.length,
          jobCount: savedJobs.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      messages: savedMessages,
      jobs: savedJobs,
    })
  } catch (error) {
    console.error("Realtime fabric run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Realtime fabric run failed",
      },
      { status: 500 }
    )
  }
}