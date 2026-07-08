import { getGammaRuntimeConsoleReader } from '../../lib/gamma/gamma-runtime-console-reader'

export const dynamic = 'force-dynamic'

export default async function GammaRuntimeConsolePage() {
  const console = await getGammaRuntimeConsoleReader()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Gamma Runtime Console</h1>
        <p className="text-slate-400 mb-8">Unified orchestration dashboard for Phase XIV runtime system</p>

        {/* Master Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-gradient-to-br from-cyan-600/30 to-cyan-900/30 rounded-lg border border-cyan-500/30 p-4">
            <div className="text-xs text-cyan-300 mb-1 font-mono">CONSOLE_SCORE</div>
            <div className="text-3xl font-bold text-cyan-300">{console.metrics.runtimeConsoleScore}</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/30 to-green-900/30 rounded-lg border border-green-500/30 p-4">
            <div className="text-xs text-green-300 mb-1 font-mono">READINESS</div>
            <div className="text-3xl font-bold text-green-300">{console.metrics.runtimeReadiness}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 rounded-lg border border-purple-500/30 p-4">
            <div className="text-xs text-purple-300 mb-1 font-mono">SAFETY</div>
            <div className="text-3xl font-bold text-purple-300">{console.metrics.safetyScore}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/30 to-blue-900/30 rounded-lg border border-blue-500/30 p-4">
            <div className="text-xs text-blue-300 mb-1 font-mono">AUDIT</div>
            <div className="text-3xl font-bold text-blue-300">{console.metrics.auditCoverage}</div>
          </div>
          <div className="bg-gradient-to-br from-lime-600/30 to-lime-900/30 rounded-lg border border-lime-500/30 p-4">
            <div className="text-xs text-lime-300 mb-1 font-mono">HEALTH</div>
            <div className="text-3xl font-bold text-lime-300">{console.metrics.healthScore}</div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 p-4">
            <div className="text-xs text-slate-400 mb-2">Approval Coverage</div>
            <div className="text-2xl font-bold text-amber-300">{console.metrics.approvalCoverage}%</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 p-4">
            <div className="text-xs text-slate-400 mb-2">Queue Health</div>
            <div className="text-2xl font-bold text-emerald-300">{console.metrics.queueHealth}</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 p-4">
            <div className="text-xs text-slate-400 mb-2">Preview Coverage</div>
            <div className="text-2xl font-bold text-sky-300">{console.metrics.previewExecutionCoverage}%</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 p-4">
            <div className="text-xs text-slate-400 mb-2">Human Review</div>
            <div className="text-2xl font-bold text-rose-300">{console.metrics.humanReviewCoverage}%</div>
          </div>
        </div>

        {/* System Components */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Component 1-3 */}
          {[
            { key: 'runtimeKernel', label: 'Runtime Kernel', detail: `Score: ${console.systemStatus.runtimeKernel.score}` },
            { key: 'actionRegistry', label: 'Action Registry', detail: `${console.systemStatus.actionRegistry.count} actions` },
            { key: 'approvalWorkflow', label: 'Approval Workflow', detail: `${console.systemStatus.approvalWorkflow.pending} pending` },
            { key: 'runtimeAudit', label: 'Runtime Audit', detail: `${console.systemStatus.runtimeAudit.events} events` },
            { key: 'executionSimulator', label: 'Execution Simulator', detail: `${console.systemStatus.executionSimulator.confidence}% confidence` },
            { key: 'runtimeQueue', label: 'Runtime Queue', detail: `${console.systemStatus.runtimeQueue.items} items` },
            { key: 'humanReview', label: 'Human Review', detail: `${console.systemStatus.humanReview.reviews} reviews` },
            { key: 'safeExecutionPolicy', label: 'Safe Exec Policy', detail: `${console.systemStatus.safeExecutionPolicy.rules} rules` },
            { key: 'runtimeAPI', label: 'Runtime API', detail: `${console.systemStatus.runtimeAPI.endpoints} endpoints` },
          ].map(comp => (
            <div key={comp.key} className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-6 hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{comp.label}</h3>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p className="text-sm text-slate-400">{comp.detail}</p>
              <p className="text-xs text-slate-500 mt-2">Status: {console.systemStatus[comp.key as keyof typeof console.systemStatus].status}</p>
            </div>
          ))}
        </div>

        {/* System Status Footer */}
        <div className="mt-8 bg-slate-800/40 rounded-lg border border-slate-700/50 p-6">
          <h3 className="text-sm font-mono text-slate-400 mb-3">SYSTEM STATUS</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div><span className="text-slate-500">Version:</span> <span className="text-white">{console.version}</span></div>
            <div><span className="text-slate-500">Status:</span> <span className="text-green-400 font-semibold">{console.status.toUpperCase()}</span></div>
            <div><span className="text-slate-500">ID:</span> <span className="text-slate-300 font-mono text-xs">{console.id}</span></div>
            <div><span className="text-slate-500">Components:</span> <span className="text-white">9</span></div>
            <div><span className="text-slate-500">Last Sync:</span> <span className="text-slate-300">{new Date(console.lastSync).toISOString().split('T')[0]}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
