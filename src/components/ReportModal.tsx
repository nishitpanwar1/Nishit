import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, X, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'video' | 'comment' | 'room' | 'creator';
  targetId: string;
  targetTitle: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { submitReport } = useApp();
  const [reason, setReason] = useState<string>('low_effort');
  const [details, setDetails] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'low_effort', label: 'Passive/Low-effort content', desc: 'Content violating the "Build > Consume" charter with empty clickbait' },
    { id: 'misleading', label: 'Misleading technical claims', desc: 'Fabricated performance benchmarks or ungrounded claims' },
    { id: 'spam', label: 'Spam / Automated farming', desc: 'Bot-generated videos, view farming, or repeated duplicate uploads' },
    { id: 'harmful', label: 'Harmful or abusive behavior', desc: 'Harassment, hate speech, or safety-critical violations (human reviewed)' },
    { id: 'copyright', label: 'Intellectual property infringement', desc: 'Unauthorized redistribution of proprietary code or media' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(targetType, targetId, reason as any, details);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-white">
          <ShieldAlert className="w-5 h-5 text-white" />
          <h3 className="text-base font-extrabold text-white uppercase font-mono">Report Content</h3>
        </div>

        <p className="text-xs text-neutral-400 mb-4 font-mono">
          Reports are evaluated by moderation personnel following our safety charter.
          Target: <span className="text-white font-medium">"{targetTitle}"</span>
        </p>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center text-white mb-2">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white font-mono">Report Submitted</p>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Ticket logged to safety audit queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-2 font-mono uppercase">Select Reason</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reason === cat.id
                        ? 'bg-neutral-900 text-white border-white shadow-sm'
                        : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={cat.id}
                      checked={reason === cat.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-0.5 accent-white"
                    />
                    <div>
                      <div className="font-bold text-white">{cat.label}</div>
                      <div className="text-[11px] text-neutral-400">{cat.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1 font-mono uppercase">
                Additional Context (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Include timestamps or relevant context..."
                className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-extrabold rounded-lg shadow-sm transition-colors font-mono uppercase tracking-wider"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
