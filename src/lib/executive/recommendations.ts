import type { ExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"

export type ExecutiveRecommendation = {
  title: string
  reason: string
  suggestedAction: string
  priority: "urgent" | "high" | "medium" | "low"
  link?: string
}

export type ExecutiveRecommendations = {
  urgent: ExecutiveRecommendation[]
  today: ExecutiveRecommendation[]
  thisWeek: ExecutiveRecommendation[]
  growth: ExecutiveRecommendation[]
  revenue: ExecutiveRecommendation[]
  delivery: ExecutiveRecommendation[]
  content: ExecutiveRecommendation[]
}

function formatAud(value: number) {
  return `AUD ${value.toLocaleString("en-AU")}`
}

function item(
  title: string,
  reason: string,
  suggestedAction: string,
  priority: ExecutiveRecommendation["priority"],
  link?: string
): ExecutiveRecommendation {
  return { title, reason, suggestedAction, priority, link }
}

export function buildExecutiveRecommendations(
  snapshot: ExecutivePlatformSnapshot
): ExecutiveRecommendations {
  const urgent: ExecutiveRecommendation[] = []
  const today: ExecutiveRecommendation[] = []
  const thisWeek: ExecutiveRecommendation[] = []
  const growth: ExecutiveRecommendation[] = []
  const revenue: ExecutiveRecommendation[] = []
  const delivery: ExecutiveRecommendation[] = []
  const content: ExecutiveRecommendation[] = []

  if (snapshot.overdueTasks > 0) {
    urgent.push(
      item(
        "Overdue delivery tasks",
        `${snapshot.overdueTasks} client task${snapshot.overdueTasks === 1 ? "" : "s"} are past due.`,
        "Open client projects and clear overdue deliverables today.",
        "urgent",
        "/admin/client-projects"
      )
    )
  }

  if (snapshot.overdueInvoices > 0) {
    urgent.push(
      item(
        "Overdue invoices",
        `${snapshot.overdueInvoices} invoice${snapshot.overdueInvoices === 1 ? "" : "s"} need payment follow-up.`,
        "Review overdue invoices and contact clients immediately.",
        "urgent",
        "/admin/invoices"
      )
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    urgent.push(
      item(
        "Editorial review backlog",
        `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} waiting for review.`,
        "Approve or reject review-required articles before publishing stalls.",
        "urgent",
        "/admin/articles"
      )
    )
  }

  if (snapshot.deliveryHealthScore < 70) {
    urgent.push(
      item(
        "Delivery health is at risk",
        `Delivery health score is ${snapshot.deliveryHealthScore} (below 70).`,
        "Review delivery intelligence and resolve overdue work.",
        "urgent",
        "/admin/delivery-intelligence"
      )
    )
  }

  for (const article of snapshot.reviewRequiredArticles) {
    today.push(
      item(
        `Review: ${article.title}`,
        "Article is in review-required status.",
        "Review, approve, or send back for edits.",
        "high",
        "/admin/articles"
      )
    )
  }

  for (const lead of snapshot.hotLeads) {
    today.push(
      item(
        `Follow up hot lead: ${lead.name}`,
        `Lead score ${lead.leadScore} indicates high intent.`,
        "Send a personal follow-up or book a strategy call.",
        "high",
        "/admin/creator-leads"
      )
    )
  }

  for (const lead of snapshot.proposalReadyLeads) {
    today.push(
      item(
        `Send proposal: ${lead.name}`,
        "Lead is marked proposal-ready.",
        "Generate or send the proposal and move to proposal-sent.",
        "high",
        "/admin/creator-leads"
      )
    )
  }

  for (const invoice of snapshot.overdueInvoiceItems) {
    today.push(
      item(
        `Chase invoice ${invoice.invoiceNumber}`,
        `Outstanding amount ${formatAud(invoice.amountAud)} is overdue.`,
        "Email the client and update invoice status after follow-up.",
        "high",
        "/admin/invoices"
      )
    )
  }

  for (const project of snapshot.dueSoonProjects) {
    today.push(
      item(
        `Project due soon: ${project.title}`,
        `Due within 7 days at ${project.progressPercent}% complete.`,
        "Prioritize remaining tasks or adjust the delivery timeline.",
        "high",
        "/admin/client-projects"
      )
    )
  }

  if (snapshot.scheduledCount === 0) {
    thisWeek.push(
      item(
        "No scheduled content",
        "There are no articles scheduled for publishing.",
        "Create or schedule at least one article for the week ahead.",
        "medium",
        "/admin/planner"
      )
    )
  }

  if (snapshot.openPipeline > 0) {
    thisWeek.push(
      item(
        "Follow up open pipeline",
        `Open pipeline value is ${formatAud(snapshot.openPipeline)}.`,
        "Advance active deals through the CRM pipeline this week.",
        "medium",
        "/admin/creator-leads"
      )
    )
  }

  if (snapshot.leadMagnetCount <= 1) {
    thisWeek.push(
      item(
        "Expand lead magnet library",
        snapshot.leadMagnetCount === 0
          ? "No lead magnets exist yet."
          : "Only one lead magnet is available.",
        "Create another lead magnet to diversify subscriber acquisition.",
        "medium",
        "/admin/lead-magnets"
      )
    )
  }

  if (snapshot.openTasks > 0) {
    thisWeek.push(
      item(
        "Complete active project tasks",
        `${snapshot.openTasks} open task${snapshot.openTasks === 1 ? "" : "s"} across client projects.`,
        "Block time this week to close open deliverables.",
        "medium",
        "/admin/client-projects"
      )
    )
  }

  if (snapshot.totalSubscribers < 50) {
    growth.push(
      item(
        "Grow subscriber list",
        `Only ${snapshot.totalSubscribers} subscriber${snapshot.totalSubscribers === 1 ? "" : "s"} on the list.`,
        "Promote newsletter signup across site, blog, and social channels.",
        "medium",
        "/admin/growth"
      )
    )
  }

  if (snapshot.leadMagnetSubscribers > 0) {
    growth.push(
      item(
        "Scale lead magnet acquisition",
        `${snapshot.leadMagnetSubscribers} lead magnet subscriber${snapshot.leadMagnetSubscribers === 1 ? "" : "s"} captured.`,
        "Add more blog CTAs and promote lead magnets in published content.",
        "medium",
        "/admin/lead-magnets"
      )
    )
  }

  if (snapshot.blogCtaSubscribers > 0) {
    growth.push(
      item(
        "Expand article CTA strategy",
        `${snapshot.blogCtaSubscribers} subscriber${snapshot.blogCtaSubscribers === 1 ? "" : "s"} came from blog CTAs.`,
        "Replicate high-performing blog CTA patterns across more articles.",
        "medium",
        "/admin/articles"
      )
    )
  }

  if (snapshot.openPipeline > 0) {
    revenue.push(
      item(
        "Pipeline follow-up",
        `Open pipeline value ${formatAud(snapshot.openPipeline)}.`,
        "Contact leads in new, contacted, and proposal-sent stages.",
        "high",
        "/admin/creator-leads"
      )
    )
  }

  if (snapshot.proposalReadyLeads.length > 0) {
    revenue.push(
      item(
        "Send pending proposals",
        `${snapshot.proposalReadyLeads.length} lead${snapshot.proposalReadyLeads.length === 1 ? "" : "s"} ready for proposal.`,
        "Generate and send proposals to unlock revenue.",
        "high",
        "/admin/proposals"
      )
    )
  }

  if (snapshot.outstandingRevenue > 0) {
    revenue.push(
      item(
        "Invoice payment follow-up",
        `Outstanding revenue ${formatAud(snapshot.outstandingRevenue)}.`,
        "Follow up on sent invoices and mark status after payment.",
        "high",
        "/admin/invoices"
      )
    )
  }

  for (const task of snapshot.overdueTaskItems) {
    delivery.push(
      item(
        `Overdue task: ${task.title}`,
        "Task due date has passed.",
        "Complete or reschedule this deliverable.",
        "urgent",
        "/admin/client-projects"
      )
    )
  }

  for (const project of snapshot.atRiskProjects) {
    delivery.push(
      item(
        `At-risk project: ${project.title}`,
        `Only ${project.progressPercent}% complete with deadline approaching.`,
        "Reallocate focus to finish critical deliverables.",
        "high",
        "/admin/delivery-intelligence"
      )
    )
  }

  for (const project of snapshot.readyToCompleteProjects) {
    delivery.push(
      item(
        `Mark project completed: ${project.title}`,
        "All tasks are done but project status is still active.",
        "Mark the project as completed and plan follow-up engagement.",
        "medium",
        "/admin/client-projects"
      )
    )
  }

  if (snapshot.reviewRequiredCount > 0) {
    content.push(
      item(
        "Clear review queue",
        `${snapshot.reviewRequiredCount} article${snapshot.reviewRequiredCount === 1 ? "" : "s"} need review.`,
        "Process the editorial review queue.",
        "high",
        "/admin/articles"
      )
    )
  }

  if (snapshot.scheduledCount === 0) {
    content.push(
      item(
        "Schedule publishing pipeline",
        "No articles are scheduled.",
        "Schedule drafts to maintain consistent publishing.",
        "medium",
        "/admin/scheduled"
      )
    )
  } else {
    content.push(
      item(
        "Scheduled content on track",
        `${snapshot.scheduledCount} article${snapshot.scheduledCount === 1 ? "" : "s"} scheduled.`,
        "Review scheduled content and confirm publish dates.",
        "low",
        "/admin/scheduled"
      )
    )
  }

  if (snapshot.draftCount > 0) {
    content.push(
      item(
        "Move drafts forward",
        `${snapshot.draftCount} draft${snapshot.draftCount === 1 ? "" : "s"} waiting.`,
        "Edit drafts and move the best ones into review or scheduling.",
        "medium",
        "/admin/articles"
      )
    )
  }

  return {
    urgent,
    today,
    thisWeek,
    growth,
    revenue,
    delivery,
    content,
  }
}
