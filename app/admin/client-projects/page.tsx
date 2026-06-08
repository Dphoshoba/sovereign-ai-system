"use client"

import { useEffect, useMemo, useState } from "react"

type Client = {
  id: string
  name: string
  email: string | null
}

type ClientProject = {
  id: string
  clientId: string
  title: string
  description: string | null
  status: string
  valueAud: number | null
  dueDate: string | null
  createdAt: string
  client: Client | null
}

type ClientProjectTask = {
  id: string
  projectId: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
}

type TaskDraft = {
  title: string
  description: string
  priority: string
  dueDate: string
}

const emptyTaskDraft: TaskDraft = {
  title: "",
  description: "",
  priority: "normal",
  dueDate: "",
}

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<ClientProjectTask[]>([])
  const [loading, setLoading] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)
  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskDraft>>({})
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    description: "",
    valueAud: "",
    dueDate: "",
  })

  async function loadProjects() {
    const response = await fetch("/api/client-projects", {
      cache: "no-store",
    })
    const result = await response.json()

    if (result.ok) {
      setProjects(result.projects)
    }
  }

  async function loadTasks() {
    const response = await fetch("/api/client-project-tasks", {
      cache: "no-store",
    })
    const result = await response.json()

    if (result.ok) {
      setTasks(result.tasks)
    }
  }

  async function loadClients() {
    const response = await fetch("/api/clients", {
      cache: "no-store",
    })
    const result = await response.json()

    if (result.ok) {
      setClients(result.clients)
      if (!form.clientId && result.clients.length > 0) {
        setForm((current) => ({
          ...current,
          clientId: result.clients[0].id,
        }))
      }
    }
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/client-projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create project")
      return
    }

    setForm({
      clientId: form.clientId,
      title: "",
      description: "",
      valueAud: "",
      dueDate: "",
    })

    await loadProjects()
  }

  async function createTask(event: React.FormEvent, projectId: string) {
    event.preventDefault()

    const draft = taskDrafts[projectId] || emptyTaskDraft

    if (!draft.title.trim()) {
      alert("Task title is required")
      return
    }

    setTaskLoading(true)

    const response = await fetch("/api/client-project-tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
      }),
    })

    const result = await response.json()
    setTaskLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to create task")
      return
    }

    setTaskDrafts((current) => ({
      ...current,
      [projectId]: { ...emptyTaskDraft },
    }))

    await loadTasks()
  }

  async function updateTaskStatus(taskId: string, status: string) {
    setTaskLoading(true)

    const response = await fetch("/api/client-project-tasks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: taskId, status }),
    })

    const result = await response.json()
    setTaskLoading(false)

    if (!result.ok) {
      alert(result.error || "Failed to update task")
      return
    }

    await loadTasks()
  }

  useEffect(() => {
    loadProjects()
    loadClients()
    loadTasks()
  }, [])

  const totalProjects = projects.length
  const activeProjects = projects.filter(
    (project) => project.status === "active"
  ).length
  const completedProjects = projects.filter(
    (project) => project.status === "completed"
  ).length
  const totalProjectValue = projects.reduce(
    (sum, project) => sum + (project.valueAud || 0),
    0
  )

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((task) => task.status === "done").length
  const openTasks = tasks.filter((task) => task.status !== "done").length

  const tasksByProject = useMemo(() => {
    return tasks.reduce<Record<string, ClientProjectTask[]>>((groups, task) => {
      if (!groups[task.projectId]) {
        groups[task.projectId] = []
      }
      groups[task.projectId].push(task)
      return groups
    }, {})
  }, [tasks])

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [projects]
  )

  function formatAud(value: number | null) {
    return `AUD ${(value || 0).toLocaleString("en-AU")}`
  }

  function formatDate(value: string | null) {
    if (!value) return "Not set"
    return new Date(value).toLocaleDateString("en-AU")
  }

  function getTaskDraft(projectId: string): TaskDraft {
    return taskDrafts[projectId] || emptyTaskDraft
  }

  function updateTaskDraft(projectId: string, updates: Partial<TaskDraft>) {
    setTaskDrafts((current) => ({
      ...current,
      [projectId]: {
        ...getTaskDraft(projectId),
        ...updates,
      },
    }))
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <section style={heroStyle}>
        <p style={eyebrowStyle}>Client Delivery OS</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Client Projects</h1>
        <p style={{ color: "#ddd", maxWidth: 820, lineHeight: 1.7 }}>
          Track active delivery work connected to Echoes & Visions client
          profiles.
        </p>
      </section>

      <section style={metricsGrid}>
        <div style={metricCard}>
          <p style={metaStyle}>Total Projects</p>
          <h2>{totalProjects}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Active Projects</p>
          <h2>{activeProjects}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Completed Projects</p>
          <h2>{completedProjects}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Total Project Value</p>
          <h2>{formatAud(totalProjectValue)}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Total Tasks</p>
          <h2>{totalTasks}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Done Tasks</p>
          <h2>{doneTasks}</h2>
        </div>

        <div style={metricCard}>
          <p style={metaStyle}>Open Tasks</p>
          <h2>{openTasks}</h2>
        </div>
      </section>

      <form onSubmit={createProject} style={formStyle}>
        <h2 style={{ marginTop: 0 }}>Create Project</h2>

        <label>
          Client
          <select
            value={form.clientId}
            onChange={(e) =>
              setForm({ ...form, clientId: e.target.value })
            }
            style={inputStyle}
            required
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.email ? ` (${client.email})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Project Title
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
            required
          />
        </label>

        <label>
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={inputStyle}
          />
        </label>

        <label>
          Value AUD
          <input
            type="number"
            min={0}
            value={form.valueAud}
            onChange={(e) => setForm({ ...form, valueAud: e.target.value })}
            style={inputStyle}
          />
        </label>

        <label>
          Due Date
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>

      <section style={{ marginTop: 40 }}>
        <h2>Project List</h2>

        <div style={{ display: "grid", gap: 16 }}>
          {sortedProjects.length === 0 && <p>No projects yet.</p>}

          {sortedProjects.map((project) => {
            const projectTasks = tasksByProject[project.id] || []
            const completedTaskCount = projectTasks.filter(
              (task) => task.status === "done"
            ).length
            const draft = getTaskDraft(project.id)

            return (
              <article key={project.id} style={cardStyle}>
                <p style={metaStyle}>{project.status}</p>
                <h3 style={{ marginTop: 0 }}>{project.title}</h3>

                <p>
                  <strong>Client:</strong>{" "}
                  {project.client?.name || "Unknown client"}
                </p>

                <p>
                  <strong>Value:</strong> {formatAud(project.valueAud)}
                </p>

                <p>
                  <strong>Due Date:</strong> {formatDate(project.dueDate)}
                </p>

                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(project.createdAt).toLocaleString("en-AU")}
                </p>

                <p>
                  <strong>Tasks:</strong> {projectTasks.length} total ·{" "}
                  {completedTaskCount} completed
                </p>

                {project.description ? <p>{project.description}</p> : null}

                <div style={taskSectionStyle}>
                  <h4 style={{ marginTop: 0 }}>Deliverables / Tasks</h4>

                  {projectTasks.length === 0 && (
                    <p style={{ color: "#666" }}>No tasks yet.</p>
                  )}

                  {projectTasks.map((task) => (
                    <div key={task.id} style={taskCardStyle}>
                      <p style={taskMetaStyle}>
                        {task.status} · {task.priority}
                      </p>
                      <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
                        {task.title}
                      </p>
                      <p style={{ margin: "0 0 8px" }}>
                        <strong>Due Date:</strong> {formatDate(task.dueDate)}
                      </p>
                      {task.description ? (
                        <p style={{ margin: "0 0 12px" }}>{task.description}</p>
                      ) : null}

                      <div style={taskButtonsStyle}>
                        <button
                          type="button"
                          disabled={taskLoading}
                          onClick={() => updateTaskStatus(task.id, "todo")}
                          style={secondaryButtonStyle}
                        >
                          Mark Todo
                        </button>
                        <button
                          type="button"
                          disabled={taskLoading}
                          onClick={() =>
                            updateTaskStatus(task.id, "in-progress")
                          }
                          style={secondaryButtonStyle}
                        >
                          Mark In Progress
                        </button>
                        <button
                          type="button"
                          disabled={taskLoading}
                          onClick={() => updateTaskStatus(task.id, "done")}
                          style={secondaryButtonStyle}
                        >
                          Mark Done
                        </button>
                      </div>
                    </div>
                  ))}

                  <form
                    onSubmit={(event) => createTask(event, project.id)}
                    style={taskFormStyle}
                  >
                    <h4 style={{ marginTop: 0 }}>Add Task</h4>

                    <label>
                      Task Title
                      <input
                        value={draft.title}
                        onChange={(e) =>
                          updateTaskDraft(project.id, { title: e.target.value })
                        }
                        style={inputStyle}
                        required
                      />
                    </label>

                    <label>
                      Description
                      <textarea
                        rows={3}
                        value={draft.description}
                        onChange={(e) =>
                          updateTaskDraft(project.id, {
                            description: e.target.value,
                          })
                        }
                        style={inputStyle}
                      />
                    </label>

                    <label>
                      Priority
                      <select
                        value={draft.priority}
                        onChange={(e) =>
                          updateTaskDraft(project.id, {
                            priority: e.target.value,
                          })
                        }
                        style={inputStyle}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </label>

                    <label>
                      Due Date
                      <input
                        type="date"
                        value={draft.dueDate}
                        onChange={(e) =>
                          updateTaskDraft(project.id, {
                            dueDate: e.target.value,
                          })
                        }
                        style={inputStyle}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={taskLoading}
                      style={buttonStyle}
                    >
                      {taskLoading ? "Adding..." : "Add Task"}
                    </button>
                  </form>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

const heroStyle: React.CSSProperties = {
  background: "#111",
  color: "#fff",
  borderRadius: 24,
  padding: 34,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "#aaa",
  margin: 0,
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 28,
}

const metricCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  maxWidth: 840,
  marginTop: 28,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 18,
  padding: 24,
}

const taskSectionStyle: React.CSSProperties = {
  marginTop: 20,
  paddingTop: 20,
  borderTop: "1px solid #eee",
}

const taskCardStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
}

const taskFormStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 16,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
}

const taskButtonsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
}

const metaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#777",
  fontSize: 13,
  margin: 0,
}

const taskMetaStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#888",
  fontSize: 12,
  margin: "0 0 8px",
}
