import { getSafeExecutionPolicyReader } from '../../lib/gamma/safe-execution-policy-reader'

export const dynamic = 'force-dynamic'

export default async function SafeExecutionPolicyPage() {
  const policy = await getSafeExecutionPolicyReader()
  const enforced = policy.policies.filter(p => p.status === 'enforced').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Safe Execution Policy</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Rules</div><div className="text-3xl font-bold text-cyan-300">{policy.metrics.policyRuleCount}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Enforced</div><div className="text-3xl font-bold text-green-300">{enforced}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Blocked</div><div className="text-3xl font-bold text-red-300">{policy.metrics.blockedOperationCount}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Allowed</div><div className="text-3xl font-bold text-green-300">{policy.metrics.allowedPreviewCount}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Safety</div><div className="text-3xl font-bold text-orange-300">{policy.metrics.safetyScore}</div></div>
          <div className="bg-slate-700/50 rounded p-4"><div className="text-xs text-slate-400 mb-1">Compliance</div><div className="text-3xl font-bold text-purple-300">{policy.metrics.complianceScore}</div></div>
        </div>
        <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Policy Rules</h2>
          <div className="space-y-2">
            {policy.policies.map(p => (
              <div key={p.rule} className="bg-slate-700/40 rounded p-3 border border-slate-600/50">
                <div className="flex justify-between items-start">
                  <div><p className="text-white font-mono text-sm">{p.rule}</p><p className="text-xs text-slate-400 mt-1">{p.description}</p></div>
                  <div className="text-right"><span className={`px-2 py-1 text-xs rounded ${p.status === 'enforced' ? 'bg-green-600/50 text-green-200' : 'bg-amber-600/50 text-amber-200'}`}>{p.status}</span>{p.violations > 0 && <p className="text-xs text-red-300 mt-1">{p.violations} violations</p>}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
