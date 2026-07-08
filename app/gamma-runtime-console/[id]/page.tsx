import { getGammaRuntimeConsoleReader } from '../../../lib/gamma/gamma-runtime-console-reader'

export const dynamic = 'force-dynamic'

interface Params { id: string }

export default async function ComponentDetailPage({ params }: { params: Params }) {
  const console = await getGammaRuntimeConsoleReader()

  const components = [
    {
      id: 'runtimeKernel',
      name: 'Runtime Kernel',
      description: 'Core execution foundation modeling work without executing',
      status: console.systemStatus.runtimeKernel.status,
      metrics: [{ label: 'Score', value: console.systemStatus.runtimeKernel.score }],
    },
    {
      id: 'actionRegistry',
      name: 'Action Registry',
      description: 'Register all possible actions as deterministic previews',
      status: console.systemStatus.actionRegistry.status,
      metrics: [{ label: 'Registered Actions', value: console.systemStatus.actionRegistry.count }],
    },
    {
      id: 'approvalWorkflow',
      name: 'Approval Workflow',
      description: 'Deterministic approval workflow preview pipeline',
      status: console.systemStatus.approvalWorkflow.status,
      metrics: [{ label: 'Pending Approvals', value: console.systemStatus.approvalWorkflow.pending }],
    },
    {
      id: 'runtimeAudit',
      name: 'Runtime Audit Log',
      description: 'Create deterministic audit trail for runtime proposals',
      status: console.systemStatus.runtimeAudit.status,
      metrics: [{ label: 'Audit Events', value: console.systemStatus.runtimeAudit.events }],
    },
    {
      id: 'executionSimulator',
      name: 'Execution Simulator',
      description: 'Simulate execution outcomes without executing',
      status: console.systemStatus.executionSimulator.status,
      metrics: [{ label: 'Confidence', value: `${console.systemStatus.executionSimulator.confidence}%` }],
    },
    {
      id: 'runtimeQueue',
      name: 'Runtime Queue',
      description: 'Model queued work items safely with dependency tracking',
      status: console.systemStatus.runtimeQueue.status,
      metrics: [{ label: 'Queued Items', value: console.systemStatus.runtimeQueue.items }],
    },
    {
      id: 'humanReview',
      name: 'Human Review Center',
      description: 'Centralize human review checkpoints',
      status: console.systemStatus.humanReview.status,
      metrics: [{ label: 'Review Items', value: console.systemStatus.humanReview.reviews }],
    },
    {
      id: 'safeExecutionPolicy',
      name: 'Safe Execution Policy',
      description: 'Define deterministic execution safety policy rules',
      status: console.systemStatus.safeExecutionPolicy.status,
      metrics: [{ label: 'Policy Rules', value: console.systemStatus.safeExecutionPolicy.rules }],
    },
    {
      id: 'runtimeAPI',
      name: 'Runtime API Preview',
      description: 'Expose runtime preview routes without executing actions',
      status: console.systemStatus.runtimeAPI.status,
      metrics: [{ label: 'Endpoints', value: console.systemStatus.runtimeAPI.endpoints }],
    },
  ]

  const component = components.find(c => c.id === params.id)

  if (!component) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Component Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">{component.name}</h1>
        <p className="text-slate-400 mb-8">{component.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-6">
            <div className="text-xs text-slate-400 mb-2 font-mono">STATUS</div>
            <div className={`text-2xl font-bold ${component.status === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>
              {component.status.toUpperCase()}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-6">
            <div className="text-xs text-slate-400 mb-2 font-mono">COMPONENT_ID</div>
            <div className="text-xl font-mono text-slate-300">{component.id}</div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-lg font-bold text-white mb-6">Metrics</h2>
          <div className="space-y-4">
            {component.metrics.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-slate-700/30 rounded">
                <span className="text-slate-300">{m.label}</span>
                <span className="text-xl font-bold text-cyan-300">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
