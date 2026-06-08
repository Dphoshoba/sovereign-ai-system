import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isOverdueTask(task: {
  dueDate: Date | null
  status: string
}) {
  if (!task.dueDate || task.status === "done") {
    return false
  }

  return task.dueDate.getTime() < Date.now()
}

export async function GET() {
  try {
    const [clients, projects, tasks] = await Promise.all([
      prisma.clientProfile.findMany({
        where: {
          type: "client",
        },
      }),
      prisma.clientProject.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clientProjectTask.findMany(),
    ])

    const clientMap = Object.fromEntries(
      clients.map((client) => [client.id, client])
    )

    const tasksByProject = tasks.reduce<
      Record<
        string,
        {
          taskCount: number
          doneTaskCount: number
          overdueTaskCount: number
        }
      >
    >((groups, task) => {
      if (!groups[task.projectId]) {
        groups[task.projectId] = {
          taskCount: 0,
          doneTaskCount: 0,
          overdueTaskCount: 0,
        }
      }

      groups[task.projectId].taskCount += 1

      if (task.status === "done") {
        groups[task.projectId].doneTaskCount += 1
      }

      if (isOverdueTask(task)) {
        groups[task.projectId].overdueTaskCount += 1
      }

      return groups
    }, {})

    const projectSummaries = projects.map((project) => {
      const counts = tasksByProject[project.id] || {
        taskCount: 0,
        doneTaskCount: 0,
        overdueTaskCount: 0,
      }

      const progressPercent =
        counts.taskCount === 0
          ? 0
          : Math.round((counts.doneTaskCount / counts.taskCount) * 100)

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        valueAud: project.valueAud,
        dueDate: project.dueDate,
        clientName: clientMap[project.clientId]?.name || "Unknown client",
        taskCount: counts.taskCount,
        doneTaskCount: counts.doneTaskCount,
        overdueTaskCount: counts.overdueTaskCount,
        progressPercent,
      }
    })

    const totalClients = clients.length
    const activeClients = clients.filter(
      (client) => client.status === "active"
    ).length
    const totalProjects = projects.length
    const activeProjects = projects.filter(
      (project) => project.status === "active"
    ).length
    const completedProjects = projects.filter(
      (project) => project.status === "completed"
    ).length
    const totalTasks = tasks.length
    const doneTasks = tasks.filter((task) => task.status === "done").length
    const openTasks = tasks.filter((task) => task.status !== "done").length
    const overdueTasks = tasks.filter((task) => isOverdueTask(task)).length
    const totalProjectValue = projects.reduce(
      (sum, project) => sum + (project.valueAud || 0),
      0
    )

    return NextResponse.json({
      ok: true,
      summary: {
        totalClients,
        activeClients,
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        openTasks,
        doneTasks,
        overdueTasks,
        totalProjectValue,
        projects: projectSummaries,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Delivery summary failed",
      },
      { status: 500 }
    )
  }
}
