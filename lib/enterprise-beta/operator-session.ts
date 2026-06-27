export type OperatorSessionCheckpoint = {
  id: string
  title: string
  required: boolean
  checkpointType: "approval" | "risk" | "intent" | "scope"
  reportOnly: true
}

export function buildOperatorSessionCheckpoints(): OperatorSessionCheckpoint[] {
  return [
    {
      id: "operator-session-approval",
      title: "High-risk operator actions require approval markers in session context",
      required: true,
      checkpointType: "approval",
      reportOnly: true,
    },
    {
      id: "operator-session-risk",
      title: "Session context carries risk category for each protected route",
      required: true,
      checkpointType: "risk",
      reportOnly: true,
    },
    {
      id: "operator-session-intent",
      title: "Operator intent identifier is linked to execution checkpoints",
      required: true,
      checkpointType: "intent",
      reportOnly: true,
    },
    {
      id: "operator-session-scope",
      title: "Operator scope is constrained by tenant/workspace claims",
      required: true,
      checkpointType: "scope",
      reportOnly: true,
    },
  ]
}
