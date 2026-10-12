import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Filter,
  Trash2,
  Clock,
  FileText,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { SafetyReport, AuditLogItem } from '../types';
import { ModerationService } from '../services/moderationService';

interface ModerationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; displayName: string; role?: string };
}

export const ModerationDashboard: React.FC<ModerationDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'audit'>('queue');
  const [loading, setLoading] = useState<boolean>(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  const loadReports = async () => {
    setLoading(true);
    const data = await ModerationService.fetchModerationQueue();
    setReports(data);
    setSelectedReport(data[0] || null);
    setLoading(false);
  };

  const handleAction = async (action: 'restricted' | 'removed' | 'dismissed') => {
    if (!selectedReport) return;
    const notes = reviewNotes.trim() || `Moderation action taken: ${action}`;

    await ModerationService.resolveReport(
      selectedReport.id,
      action,
      notes,
      currentUser.id,
      currentUser.displayName,
      selectedReport.targetType,
      selectedReport.targetId
    );

    // Record local audit log for display
    const newLog: AuditLogItem = {
      id: `audit_${Date.now()}`,
      actorId: currentUser.id,
      actorName: currentUser.displayName,
      action: `MODERATION_${action.toUpperCase()}`,
      targetType: selectedReport.targetType,
      targetId: selectedReport.targetId,
      details: notes,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Update local report state
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? {
              ...r,
              status: action === 'dismissed' ? 'dismissed' : 'resolved',
              actionTaken: action === 'dismissed' ? 'none' : action,
              moderatorNotes: notes,
              reviewedBy: currentUser.displayName,
            }
          : r
      )
    );

    setReviewNotes('');
    const remaining = reports.filter((r) => r.id !== selectedReport.id && r.status === 'pending');
    setSelectedReport(remaining[0] || null);
  };

  if (!isOpen) return null;

  const filteredReports = reports.filter(
    (r) => filterPriority === 'all' || r.priority === filterPriority
  );
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div
      role="dialog"
      aria-labelledby="moderation-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4"
    >
      <div className="w-full max-w-5xl bg-[#121212] border border-[#272727] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#272727] bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="moderation-title" className="text-sm font-bold text-white font-display">
                  Community Safety & Moderation Queue
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="text-[11px] text-[#aaaaaa]">
                Enforcing PRD Section 13: Zero tolerance for harassment, fraud, and low-effort spam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#202020] rounded-lg p-0.5 border border-[#303030] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'queue' ? 'bg-white text-black font-semibold' : 'text-[#aaaaaa] hover:text-white'
                }`}
              >
                Triage Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'audit' ? 'bg-white text-black font-semibold' : 'text-[#aaaaaa] hover:text-white'
                }`}
              >
                Audit Trail ({auditLogs.length})
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#202020] rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'queue' ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden text-xs">
            {/* Left Column: Reports List */}
            <div className="md:col-span-5 border-r border-[#272727] flex flex-col overflow-y-auto">
              {/* Filter Bar */}
              <div className="p-3 border-b border-[#272727] flex items-center justify-between gap-2 bg-[#141414]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#aaaaaa]">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Priority:</span>
                </div>
                <div className="flex gap-1">
                  {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors ${
                        filterPriority === p
                          ? 'bg-[#ff0033] text-white font-bold'
                          : 'bg-[#202020] text-[#aaaaaa] hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#202020] overflow-y-auto">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'bg-[#1e1e1e] border-l-2 border-white'
                        : 'hover:bg-[#181818]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          report.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : report.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {report.priority || 'medium'} priority
                      </span>
                      <span className="text-[10px] text-[#717171] font-mono">
                        {report.status}
                      </span>
                    </div>

                    <div className="font-semibold text-white line-clamp-1">
                      {report.targetTitle || `${report.targetType} #${report.targetId}`}
                    </div>
                    <div className="text-[11px] text-[#aaaaaa] mt-1 line-clamp-2">
                      Reason: <span className="text-white font-medium capitalize">{report.reason}</span> — {report.details}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#717171] font-mono mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>By @{report.reporterName || 'community_user'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Case Review & Resolution Action */}
            <div className="md:col-span-7 flex flex-col p-5 bg-[#0f0f0f] overflow-y-auto space-y-4">
              {selectedReport ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] text-[#aaaaaa] font-mono uppercase">
                        Target Type: <span className="text-white">{selectedReport.targetType}</span> · ID: {selectedReport.targetId}
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">
                        {selectedReport.targetTitle || 'Reported Content Details'}
                      </h3>
                    </div>
                    <div className="px-2.5 py-1 bg-[#222222] border border-[#333333] rounded-lg text-[11px] font-mono text-white">
                      Flag: {selectedReport.reason}
                    </div>
                  </div>

                  {/* Reporter Statement */}
                  <div className="p-3.5 bg-[#181818] border border-[#272727] rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-[#aaaaaa] uppercase">
                      Reporter Testimony & Evidence
                    </div>
                    <p className="text-xs text-[#dddddd] leading-relaxed">
                      "{selectedReport.details}"
                    </p>
                  </div>

                  {/* Review Notes Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-[#aaaaaa]">
                      Moderator Review Notes & Audit Reason *
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Specify enforcement rationale, terms violation code, or dismissal note..."
                      className="w-full bg-[#161616] border border-[#272727] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAction('restricted')}
                      className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Restrict (Safe Mode)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('removed')}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove & Delist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('dismissed')}
                      className="px-4 py-2.5 bg-[#252525] hover:bg-[#303030] text-[#cccccc] font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dismiss (No Violation)</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#aaaaaa]">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
                  <div className="font-bold text-white text-sm">Moderation Queue Clear</div>
                  <p className="text-xs text-[#717171] mt-1 max-w-xs">
                    All flagged community content has been reviewed according to PRD safety policies.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audit Logs Tab */
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Immutable Moderation Audit Log (PRD Section 13)
            </div>
            {auditLogs.length === 0 ? (
              <div className="text-xs text-[#aaaaaa] py-8 text-center bg-[#161616] rounded-xl border border-[#272727]">
                Actions taken during this session will be recorded here with timestamp, actor, and target ID.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-[#161616] border border-[#272727] rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-emerald-400 font-bold">{log.action}</span>
                    <span className="text-[#aaaaaa] ml-2">by {log.actorName}</span>
                    <p className="text-white text-[11px] font-sans mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-[#717171] text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
