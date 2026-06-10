import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { buildExecutiveKnowledgeGraph } from "@/lib/executive/knowledge-graph"

// Phase 18 — Executive Intelligence Activation seed.
// Duplicate-safe: matches on natural keys (title / email / invoiceNumber) before creating.

const QUARTER = "Q2"
const YEAR = 2026

async function seedQuarterlyGoals() {
  const goals = [
    {
      title: "Grow newsletter subscribers to 1,000",
      description: "Build the owned audience through lead magnets and consistent publishing.",
      category: "growth",
      status: "active",
      targetValue: 1000,
      currentValue: 120,
      progress: 12,
      owner: "Growth Director",
    },
    {
      title: "Reach $15k AUD quarterly client revenue",
      description: "Convert creator leads into automation delivery projects.",
      category: "revenue",
      status: "active",
      targetValue: 15000,
      currentValue: 4500,
      progress: 30,
      owner: "CEO",
    },
    {
      title: "Publish 24 SEO articles this quarter",
      description: "Two articles per week through the research and publishing pipeline.",
      category: "content",
      status: "active",
      targetValue: 24,
      currentValue: 6,
      progress: 25,
      owner: "Content Director",
    },
    {
      title: "Launch creator automation productized service",
      description: "Package the audit, proposal, and delivery flow into a repeatable offer.",
      category: "product",
      status: "planned",
      targetValue: 1,
      currentValue: 0,
      progress: 10,
      owner: "COO",
    },
    {
      title: "Stand up executive operating rhythm",
      description: "Weekly boardroom, planning cycles, and monthly reviews running consistently.",
      category: "operations",
      status: "active",
      targetValue: 12,
      currentValue: 4,
      progress: 33,
      owner: "COO",
    },
  ]

  const records = []

  for (const goal of goals) {
    const existing = await prisma.quarterlyGoal.findFirst({
      where: { title: goal.title, quarter: QUARTER, year: YEAR },
    })

    if (existing) {
      records.push(
        await prisma.quarterlyGoal.update({
          where: { id: existing.id },
          data: goal,
        })
      )
    } else {
      records.push(
        await prisma.quarterlyGoal.create({
          data: { ...goal, quarter: QUARTER, year: YEAR },
        })
      )
    }
  }

  return records
}

async function seedStrategicInitiatives(goals: { id: string; title: string }[]) {
  const goalByTitle = new Map(goals.map((goal) => [goal.title, goal.id]))

  const initiatives = [
    {
      title: "Lead magnet funnel optimization",
      description: "Improve lead magnet landing pages and email capture flow.",
      priority: "high",
      status: "in_progress",
      ownerSystem: "growth",
      targetOutcome: "Higher subscriber conversion from organic traffic.",
      riskLevel: "low",
      progress: 40,
      goalTitle: "Grow newsletter subscribers to 1,000",
    },
    {
      title: "Creator lead nurture sequence",
      description: "Email nurture flow from starter pack download to audit booking.",
      priority: "high",
      status: "in_progress",
      ownerSystem: "crm",
      targetOutcome: "More audits booked from existing leads.",
      riskLevel: "medium",
      progress: 35,
      goalTitle: "Reach $15k AUD quarterly client revenue",
    },
    {
      title: "Research pipeline throughput upgrade",
      description: "Tighten the fact-verification pipeline so two articles ship weekly.",
      priority: "medium",
      status: "in_progress",
      ownerSystem: "content",
      targetOutcome: "Consistent two-articles-per-week cadence.",
      riskLevel: "medium",
      progress: 50,
      goalTitle: "Publish 24 SEO articles this quarter",
    },
    {
      title: "Productized service packaging",
      description: "Define tiers, pricing, and delivery checklist for the automation offer.",
      priority: "medium",
      status: "proposed",
      ownerSystem: "delivery",
      targetOutcome: "A sellable, repeatable service package.",
      riskLevel: "medium",
      progress: 15,
      goalTitle: "Launch creator automation productized service",
    },
    {
      title: "Executive review cadence automation",
      description: "Automate weekly boardroom prep and monthly review generation.",
      priority: "low",
      status: "in_progress",
      ownerSystem: "executive",
      targetOutcome: "Reviews produced on schedule without manual prep.",
      riskLevel: "low",
      progress: 60,
      goalTitle: "Stand up executive operating rhythm",
    },
  ]

  const records = []

  for (const { goalTitle, ...initiative } of initiatives) {
    const goalId = goalByTitle.get(goalTitle) ?? null

    const existing = await prisma.strategicInitiative.findFirst({
      where: { title: initiative.title },
    })

    if (existing) {
      records.push(
        await prisma.strategicInitiative.update({
          where: { id: existing.id },
          data: { ...initiative, goalId },
        })
      )
    } else {
      records.push(
        await prisma.strategicInitiative.create({
          data: { ...initiative, goalId },
        })
      )
    }
  }

  return records
}

async function seedExecutiveDecisions() {
  const decisions = [
    {
      title: "Focus Q2 on creator automation niche",
      description: "Concentrate marketing and delivery on creator/solo-founder automation.",
      category: "strategy",
      status: "implemented",
      outcome: "Clearer positioning and better-qualified leads.",
      effectiveness: 4,
      impactArea: "Growth",
      followUpRequired: false,
    },
    {
      title: "Disable heavy video routes on Vercel",
      description: "Move ffmpeg/upload routes to local-only modules to fit serverless limits.",
      category: "infrastructure",
      status: "implemented",
      outcome: "Production deploys unblocked.",
      effectiveness: 5,
      impactArea: "Operations",
      followUpRequired: true,
      actionTaken: "Stubbed routes; preserved logic in .local.ts modules.",
    },
    {
      title: "Adopt weekly boardroom session cadence",
      description: "Run the executive boardroom every Monday morning.",
      category: "operations",
      status: "implemented",
      outcome: "Priorities reviewed weekly with clearer follow-ups.",
      effectiveness: 4,
      impactArea: "Operations",
      followUpRequired: false,
    },
    {
      title: "Price audits as paid engagements",
      description: "Charge for creator audits instead of offering them free.",
      category: "revenue",
      status: "approved",
      outcome: null,
      effectiveness: null,
      impactArea: "Revenue",
      followUpRequired: true,
    },
    {
      title: "Standardize proposals from audit findings",
      description: "Generate proposals directly from audit data for faster turnaround.",
      category: "delivery",
      status: "implemented",
      outcome: "Proposal turnaround reduced significantly.",
      effectiveness: 4,
      impactArea: "Delivery",
      followUpRequired: false,
    },
  ]

  const records = []

  for (const decision of decisions) {
    const existing = await prisma.executiveDecision.findFirst({
      where: { title: decision.title },
    })

    if (existing) {
      records.push(
        await prisma.executiveDecision.update({
          where: { id: existing.id },
          data: decision,
        })
      )
    } else {
      records.push(
        await prisma.executiveDecision.create({ data: decision })
      )
    }
  }

  return records
}

async function seedExecutiveLessons(
  decisions: { id: string; title: string }[]
) {
  const decisionByTitle = new Map(
    decisions.map((decision) => [decision.title, decision.id])
  )

  const lessons = [
    {
      title: "Niche focus improves lead quality",
      category: "strategy",
      lesson:
        "Narrowing positioning to creator automation produced fewer but better-qualified leads.",
      impactArea: "Growth",
      effectiveness: 4,
      sourceDecisionTitle: "Focus Q2 on creator automation niche",
    },
    {
      title: "Keep heavy dependencies out of serverless routes",
      category: "infrastructure",
      lesson:
        "ffmpeg and media tracing pushed functions past 300MB; heavy work belongs in workers.",
      impactArea: "Operations",
      effectiveness: 5,
      sourceDecisionTitle: "Disable heavy video routes on Vercel",
    },
    {
      title: "Weekly cadence beats ad-hoc reviews",
      category: "operations",
      lesson:
        "A fixed weekly boardroom slot keeps priorities current and reduces drift.",
      impactArea: "Operations",
      effectiveness: 4,
      sourceDecisionTitle: "Adopt weekly boardroom session cadence",
    },
    {
      title: "Audits convert better with concrete findings",
      category: "delivery",
      lesson:
        "Proposals tied to specific audit findings close faster than generic pitches.",
      impactArea: "Delivery",
      effectiveness: 4,
      sourceDecisionTitle: "Standardize proposals from audit findings",
    },
    {
      title: "Seed data accelerates system validation",
      category: "operations",
      lesson:
        "Realistic seed records make executive dashboards testable before live data accumulates.",
      impactArea: "Operations",
      effectiveness: 3,
      sourceDecisionTitle: null,
    },
  ]

  const records = []

  for (const { sourceDecisionTitle, ...lesson } of lessons) {
    const sourceDecisionId = sourceDecisionTitle
      ? decisionByTitle.get(sourceDecisionTitle) ?? null
      : null

    const existing = await prisma.executiveLesson.findFirst({
      where: { title: lesson.title },
    })

    if (existing) {
      records.push(
        await prisma.executiveLesson.update({
          where: { id: existing.id },
          data: { ...lesson, sourceDecisionId },
        })
      )
    } else {
      records.push(
        await prisma.executiveLesson.create({
          data: { ...lesson, sourceDecisionId },
        })
      )
    }
  }

  return records
}

async function seedClients() {
  const clients = [
    {
      name: "Harvest Lane Media",
      email: "ops@harvestlanemedia.example",
      type: "client",
      status: "active",
      source: "referral",
      notes: "YouTube channel needing publishing automation.",
    },
    {
      name: "Stonebridge Coaching",
      email: "hello@stonebridgecoaching.example",
      type: "client",
      status: "active",
      source: "lead-magnet",
      notes: "Solo coach automating newsletter and lead follow-up.",
    },
    {
      name: "Northgate Studios",
      email: "team@northgatestudios.example",
      type: "lead",
      status: "qualified",
      source: "audit",
      notes: "Podcast studio exploring content repurposing automation.",
    },
  ]

  const records = []

  for (const client of clients) {
    const existing = await prisma.clientProfile.findFirst({
      where: { name: client.name },
    })

    if (existing) {
      records.push(
        await prisma.clientProfile.update({
          where: { id: existing.id },
          data: client,
        })
      )
    } else {
      records.push(await prisma.clientProfile.create({ data: client }))
    }
  }

  return records
}

async function seedProjects(clients: { id: string; name: string }[]) {
  const clientByName = new Map(clients.map((client) => [client.name, client.id]))

  const projects = [
    {
      title: "Publishing pipeline automation",
      description: "Automate article-to-social distribution for the media channel.",
      status: "active",
      valueAud: 4500,
      clientName: "Harvest Lane Media",
    },
    {
      title: "Newsletter and CRM automation",
      description: "Automated lead capture, tagging, and weekly newsletter flow.",
      status: "active",
      valueAud: 3200,
      clientName: "Stonebridge Coaching",
    },
    {
      title: "Content repurposing audit implementation",
      description: "Implement audit recommendations for podcast clip repurposing.",
      status: "planned",
      valueAud: 2800,
      clientName: "Northgate Studios",
    },
  ]

  const records = []

  for (const { clientName, ...project } of projects) {
    const clientId = clientByName.get(clientName)

    if (!clientId) {
      continue
    }

    const existing = await prisma.clientProject.findFirst({
      where: { title: project.title, clientId },
    })

    if (existing) {
      records.push(
        await prisma.clientProject.update({
          where: { id: existing.id },
          data: project,
        })
      )
    } else {
      records.push(
        await prisma.clientProject.create({
          data: { ...project, clientId },
        })
      )
    }
  }

  return records
}

async function seedTasks(projects: { id: string; title: string }[]) {
  const projectByTitle = new Map(
    projects.map((project) => [project.title, project.id])
  )

  const tasks = [
    {
      title: "Map current publishing workflow",
      status: "done",
      priority: "high",
      projectTitle: "Publishing pipeline automation",
    },
    {
      title: "Build social distribution automation",
      status: "in_progress",
      priority: "high",
      projectTitle: "Publishing pipeline automation",
    },
    {
      title: "Set up lead capture forms",
      status: "done",
      priority: "normal",
      projectTitle: "Newsletter and CRM automation",
    },
    {
      title: "Configure newsletter automation",
      status: "in_progress",
      priority: "high",
      projectTitle: "Newsletter and CRM automation",
    },
    {
      title: "Confirm audit scope with client",
      status: "todo",
      priority: "high",
      projectTitle: "Content repurposing audit implementation",
    },
    {
      title: "Draft clip repurposing workflow",
      status: "todo",
      priority: "normal",
      projectTitle: "Content repurposing audit implementation",
    },
  ]

  const records = []

  for (const { projectTitle, ...task } of tasks) {
    const projectId = projectByTitle.get(projectTitle)

    if (!projectId) {
      continue
    }

    const existing = await prisma.clientProjectTask.findFirst({
      where: { title: task.title, projectId },
    })

    if (existing) {
      records.push(
        await prisma.clientProjectTask.update({
          where: { id: existing.id },
          data: task,
        })
      )
    } else {
      records.push(
        await prisma.clientProjectTask.create({
          data: { ...task, projectId },
        })
      )
    }
  }

  return records
}

async function seedCreatorLeads() {
  const leads = [
    {
      name: "Mia Calder",
      email: "mia@caldercreates.example",
      creatorType: "youtuber",
      source: "starter-pack",
      status: "engaged",
      leadScore: 72,
      readiness: "warm",
      niche: "Productivity content",
      notes: "Downloaded starter pack; asked about publishing automation.",
      projectedValue: 3500,
    },
    {
      name: "Jonah Reeve",
      email: "jonah@reevewrites.example",
      creatorType: "newsletter",
      source: "audit",
      status: "qualified",
      leadScore: 85,
      readiness: "hot",
      niche: "Finance newsletter",
      notes: "Completed audit; reviewing proposal options.",
      projectedValue: 5200,
    },
    {
      name: "Priya Anand",
      email: "priya@anandaudio.example",
      creatorType: "podcaster",
      source: "referral",
      status: "new",
      leadScore: 55,
      readiness: "warm",
      niche: "Wellness podcast",
      notes: "Referred by existing client; intro call scheduled.",
      projectedValue: 2600,
    },
  ]

  const records = []

  for (const lead of leads) {
    records.push(
      await prisma.creatorLead.upsert({
        where: { email: lead.email },
        update: lead,
        create: lead,
      })
    )
  }

  return records
}

async function seedCreatorProposals(
  leads: { id: string; email: string }[]
) {
  const leadByEmail = new Map(leads.map((lead) => [lead.email, lead.id]))

  const proposals = [
    {
      title: "Publishing automation package — Mia Calder",
      description: "End-to-end publishing automation for YouTube and newsletter.",
      packageType: "automation",
      status: "sent",
      estimatedValue: 3500,
      implementationWeeks: 4,
      leadEmail: "mia@caldercreates.example",
    },
    {
      title: "Newsletter growth system — Jonah Reeve",
      description: "Lead capture, nurture, and weekly send automation.",
      packageType: "growth",
      status: "review",
      estimatedValue: 5200,
      implementationWeeks: 6,
      leadEmail: "jonah@reevewrites.example",
    },
    {
      title: "Podcast repurposing starter — Priya Anand",
      description: "Clip extraction and social repurposing workflow.",
      packageType: "starter",
      status: "draft",
      estimatedValue: 2600,
      implementationWeeks: 3,
      leadEmail: "priya@anandaudio.example",
    },
  ]

  const records = []

  for (const { leadEmail, ...proposal } of proposals) {
    const leadId = leadByEmail.get(leadEmail)

    if (!leadId) {
      continue
    }

    const existing = await prisma.creatorProposal.findFirst({
      where: { title: proposal.title },
    })

    if (existing) {
      records.push(
        await prisma.creatorProposal.update({
          where: { id: existing.id },
          data: { ...proposal, leadId },
        })
      )
    } else {
      records.push(
        await prisma.creatorProposal.create({
          data: { ...proposal, leadId },
        })
      )
    }
  }

  return records
}

async function seedInvoices(
  clients: { id: string; name: string }[],
  projects: { id: string; title: string; clientId: string }[]
) {
  const clientByName = new Map(clients.map((client) => [client.name, client.id]))
  const projectByTitle = new Map(
    projects.map((project) => [project.title, project.id])
  )

  const invoices = [
    {
      invoiceNumber: "INV-2026-001",
      amountAud: 2250,
      status: "paid",
      notes: "Publishing pipeline automation — milestone 1.",
      clientName: "Harvest Lane Media",
      projectTitle: "Publishing pipeline automation",
    },
    {
      invoiceNumber: "INV-2026-002",
      amountAud: 1600,
      status: "sent",
      notes: "Newsletter and CRM automation — milestone 1.",
      clientName: "Stonebridge Coaching",
      projectTitle: "Newsletter and CRM automation",
    },
    {
      invoiceNumber: "INV-2026-003",
      amountAud: 1400,
      status: "draft",
      notes: "Content repurposing implementation — deposit.",
      clientName: "Northgate Studios",
      projectTitle: "Content repurposing audit implementation",
    },
  ]

  const records = []

  for (const { clientName, projectTitle, ...invoice } of invoices) {
    const clientId = clientByName.get(clientName)
    const projectId = projectByTitle.get(projectTitle) ?? null

    if (!clientId) {
      continue
    }

    const existing = await prisma.clientInvoice.findFirst({
      where: { invoiceNumber: invoice.invoiceNumber },
    })

    if (existing) {
      records.push(
        await prisma.clientInvoice.update({
          where: { id: existing.id },
          data: { ...invoice, clientId, projectId },
        })
      )
    } else {
      records.push(
        await prisma.clientInvoice.create({
          data: { ...invoice, clientId, projectId },
        })
      )
    }
  }

  return records
}

async function main() {
  console.log("Phase 18 — Executive Intelligence Activation seed")

  const goals = await seedQuarterlyGoals()
  console.log(`QuarterlyGoal: ${goals.length}`)

  const initiatives = await seedStrategicInitiatives(goals)
  console.log(`StrategicInitiative: ${initiatives.length}`)

  const decisions = await seedExecutiveDecisions()
  console.log(`ExecutiveDecision: ${decisions.length}`)

  const lessons = await seedExecutiveLessons(decisions)
  console.log(`ExecutiveLesson: ${lessons.length}`)

  const clients = await seedClients()
  console.log(`ClientProfile: ${clients.length}`)

  const projects = await seedProjects(clients)
  console.log(`ClientProject: ${projects.length}`)

  const tasks = await seedTasks(projects)
  console.log(`ClientProjectTask: ${tasks.length}`)

  const creatorLeads = await seedCreatorLeads()
  console.log(`CreatorLead: ${creatorLeads.length}`)

  const proposals = await seedCreatorProposals(creatorLeads)
  console.log(`CreatorProposal: ${proposals.length}`)

  const invoices = await seedInvoices(clients, projects)
  console.log(`ClientInvoice: ${invoices.length}`)

  console.log("Building executive knowledge graph...")
  const graph = await buildExecutiveKnowledgeGraph()
  console.log("Knowledge graph:", graph)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => process.exit())
