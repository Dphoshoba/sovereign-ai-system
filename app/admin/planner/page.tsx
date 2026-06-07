import { PlannerRunner } from "@/components/planner/PlannerRunner"

export default function PlannerPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Weekly Planner</h1>
      <p>
        Analyze category gaps and create a new strategic draft automatically.
      </p>

      <PlannerRunner />
    </main>
  )
}