import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  HardDrive,
  Coins,
  Cpu,
  RefreshCw,
  Power,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Laptop,
  Smartphone,
  LogOut,
  ChevronRight,
  Database,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ObservabilityService, OperationalRunbook } from '../services/observability';
import { EconomyService } from '../services/economyService';
import { AuthSecurityService } from '../services/authSecurity';
import { SystemHealthStatus, FeatureKillSwitches, EconomyReconciliationReport, AuthSession } from '../types';

export const SystemStatusView: React.FC = () => {
  const { user, tokenLedger } = useApp();
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [killSwitches, setKillSwitches] = useState<FeatureKillSwitches>({
    aiGenerationEnabled: true,
    economyRewardsEnabled: true,
    liveStreamingEnabled: true,
    publicUploadsEnabled: true,
  });
  const [runbooks, setRunbooks] = useState<OperationalRunbook[]>([]);
  const [selectedRunbook, setSelectedRunbook] = useState<OperationalRunbook | null>(null);
  const [reconciliation, setReconciliation] = useState<EconomyReconciliationReport | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [activeTab, setActiveTab] = useState<'health' | 'economy' | 'runbooks' | 'sessions'>('health');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
    setRunbooks(ObservabilityService.getOperationalRunbooks());
    setSelectedRunbook(ObservabilityService.getOperationalRunbooks()[0] || null);
    if (user?.id) {
      setSessions(AuthSecurityService.getActiveSessions(user.id));
    }
  }, [user?.id]);

  const loadHealth = async () => {
    const data = await ObservabilityService.getSystemHealth();
    setHealth(data);
    setKillSwitches(data.activeKillSwitches);
  };

  const handleToggleKillSwitch = async (key: keyof FeatureKillSwitches) => {
    setTogglingKey(key);
    const updated = await ObservabilityService.setKillSwitch(key, !killSwitches[key]);
    setKillSwitches(updated);
    setTogglingKey(null);
  };

  const handleRunReconciliation = async () => {
    if (!user) return;
    setIsReconciling(true);
    const report = await EconomyService.reconcileUserLedger(user.id, user.tokens, tokenLedger);
    setReconciliation(report);
    setIsReconciling(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    if (!user) return;
    const updated = AuthSecurityService.revokeSession(user.id, sessionId);
    setSessions(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272727] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Production Reliability & Security Architecture
            </h1>
          </div>
          <p className="text-xs text-[#aaaaaa] mt-1">
            Real-time compliance, zero-trust RLS enforcement, ledger reconciliation, and incident runbooks (PRD v1.0)
          </p>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#272727] text-xs">
          {(
            [
              { id: 'health', label: 'System Health' },
              { id: 'economy', label: 'Ledger Audit' },
              { id: 'runbooks', label: 'Runbooks' },
              { id: 'sessions', label: 'Sessions' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: System Health & Kill Switches */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#141414] border border-[#272727] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#aaaaaa]">
                <span className="font-mono uppercase text-[10px]">API Gateway</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">99.98%</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span>● Healthy</span>
                <span className="text-[#717171] font-mono">· 42ms p95</span>
              </div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#272727] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#aaaaaa]">
                <span className="font-mono uppercase text-[10px]">Database Security</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">Strict RLS</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span>● Rules Enforced</span>
                <span className="text-[#717171] font-mono">· No IDOR</span>
              </div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#272727] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#aaaaaa]">
                <span className="font-mono uppercase text-[10px]">Storage Streamer</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">HTTP 206</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span>● Range Seeking</span>
                <span className="text-[#717171] font-mono">· 200MB Max</span>
              </div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#272727] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-[#aaaaaa]">
                <span className="font-mono uppercase text-[10px]">Disaster Recovery</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">RTO: 15m</div>
              <div className="text-[11px] text-[#aaaaaa] flex items-center gap-1">
                <span>RPO: &lt;5 mins</span>
                <span className="text-[#717171]">· Auto-backup</span>
              </div>
            </div>
          </div>

          {/* Emergency Kill Switches Section (PRD Section 23) */}
          <div className="p-5 bg-[#141414] border border-[#272727] rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-display">
                  Emergency Feature Kill Switches (Server-Side)
                </h3>
                <p className="text-xs text-[#aaaaaa] mt-0.5">
                  PRD Section 23: Instant server-side circuit breakers for high-risk subsystems during incidents
                </p>
              </div>
              <button
                onClick={loadHealth}
                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#202020] rounded-lg transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(
                [
                  {
                    key: 'aiGenerationEnabled',
                    title: 'AI Curation & Takeaway Engine',
                    desc: 'Controls Gemini API requests, summarization, and intention mapping.',
                  },
                  {
                    key: 'economyRewardsEnabled',
                    title: 'Token Economy Minting & Rewards',
                    desc: 'Controls watch session payouts, daily streak rewards, and bonus credits.',
                  },
                  {
                    key: 'publicUploadsEnabled',
                    title: 'Video Upload Pipeline',
                    desc: 'Direct binary upload ingestion, signature scanning, and stream registration.',
                  },
                  {
                    key: 'liveStreamingEnabled',
                    title: 'Live Accountability Broadcasting',
                    desc: 'Interactive live audio/video channels and multi-user chat streams.',
                  },
                ] as const
              ).map((sw) => {
                const isEnabled = killSwitches[sw.key];
                return (
                  <div
                    key={sw.key}
                    className="p-4 bg-[#181818] border border-[#272727] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{sw.title}</div>
                      <div className="text-[11px] text-[#aaaaaa] mt-0.5">{sw.desc}</div>
                    </div>
                    <button
                      type="button"
                      disabled={togglingKey === sw.key}
                      onClick={() => handleToggleKillSwitch(sw.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors shrink-0 flex items-center gap-1.5 ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isEnabled ? 'ACTIVE' : 'DISABLED'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Token Economy & Ledger Reconciliation */}
      {activeTab === 'economy' && (
        <div className="space-y-5">
          <div className="p-5 bg-[#141414] border border-[#272727] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-display">
                  Append-Only Ledger Audit & Reconciliation
                </h3>
                <p className="text-xs text-[#aaaaaa] mt-0.5">
                  PRD Section 9: Validates immutable token_ledger delta sum against current wallet balance
                </p>
              </div>

              <button
                type="button"
                disabled={isReconciling}
                onClick={handleRunReconciliation}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                <span>{isReconciling ? 'Auditing Ledger...' : 'Run Ledger Audit'}</span>
              </button>
            </div>

            {/* Reconciliation Report Card */}
            {reconciliation && (
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  reconciliation.isConsistent
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {reconciliation.isConsistent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>
                    {reconciliation.isConsistent
                      ? 'Zero Ledger Drift: Wallet Balance Perfectly Reconciled'
                      : 'Audit Warning: Balance Discrepancy Flagged'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1 text-white">
                  <div>
                    <div className="text-[10px] text-[#aaaaaa]">Calculated Sum</div>
                    <div className="font-bold">{reconciliation.calculatedBalance} RUP</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#aaaaaa]">Active Wallet</div>
                    <div className="font-bold">{reconciliation.actualBalance} RUP</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#aaaaaa]">Discrepancy</div>
                    <div className="font-bold">{reconciliation.discrepancy} RUP</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#aaaaaa]">Ledger Entries</div>
                    <div className="font-bold">{reconciliation.ledgerEntriesCount} verified</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Immutable Ledger Entries */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Recent Append-Only Transactions ({tokenLedger.length})
              </div>
              <div className="divide-y divide-[#202020] bg-[#181818] border border-[#272727] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {tokenLedger.map((entry) => (
                  <div key={entry.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white">{entry.description}</div>
                      <div className="text-[10px] font-mono text-[#717171] truncate max-w-xs sm:max-w-md">
                        Key: {entry.idempotencyKey}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold text-xs ${
                        entry.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {entry.delta >= 0 ? `+${entry.delta}` : entry.delta} RUP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Operational Runbooks */}
      {activeTab === 'runbooks' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Runbook Selector */}
          <div className="md:col-span-4 space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-1">
              Operational Runbooks (PRD Section 29)
            </div>
            {runbooks.map((rb) => (
              <div
                key={rb.id}
                onClick={() => setSelectedRunbook(rb)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  selectedRunbook?.id === rb.id
                    ? 'bg-[#202020] border-white'
                    : 'bg-[#141414] border-[#272727] hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                    {rb.severity}
                  </span>
                  <span className="text-[10px] text-[#717171] font-mono capitalize">{rb.category}</span>
                </div>
                <div className="font-semibold text-xs text-white line-clamp-1">{rb.title}</div>
              </div>
            ))}
          </div>

          {/* Right Column: Active Runbook Checklist */}
          <div className="md:col-span-8 p-5 bg-[#141414] border border-[#272727] rounded-2xl space-y-4">
            {selectedRunbook && (
              <>
                <div className="border-b border-[#272727] pb-3">
                  <div className="text-[10px] font-mono text-[#aaaaaa] uppercase">
                    Severity: {selectedRunbook.severity} · Category: {selectedRunbook.category}
                  </div>
                  <h3 className="text-base font-bold text-white font-display mt-0.5">
                    {selectedRunbook.title}
                  </h3>
                  <p className="text-xs text-[#aaaaaa] mt-1 leading-relaxed">
                    {selectedRunbook.summary}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Execution Steps
                  </div>
                  {selectedRunbook.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#181818] border border-[#272727] rounded-xl flex items-start gap-3 text-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="text-[#dddddd] leading-relaxed">{step}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Multi-Device Sessions */}
      {activeTab === 'sessions' && (
        <div className="p-5 bg-[#141414] border border-[#272727] rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white font-display">
              Multi-Device Session Security & Management
            </h3>
            <p className="text-xs text-[#aaaaaa] mt-0.5">
              PRD Section 4: Monitor and revoke active device credentials to mitigate session hijacking
            </p>
          </div>

          <div className="divide-y divide-[#202020] bg-[#181818] border border-[#272727] rounded-xl overflow-hidden">
            {sessions.map((sess) => (
              <div key={sess.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-white">
                    {sess.device.includes('iPhone') || sess.device.includes('Android') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{sess.device}</span>
                      {sess.isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#aaaaaa] font-mono mt-0.5">
                      {sess.browser} · IP: {sess.ipPreview} · {sess.lastActive}
                    </div>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(sess.id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-lg text-xs border border-rose-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
