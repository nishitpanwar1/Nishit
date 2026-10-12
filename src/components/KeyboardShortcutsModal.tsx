import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const groups: ShortcutGroup[] = [
    {
      title: 'Playback',
      shortcuts: [
        { key: 'k / Space', description: 'Toggle play/pause' },
        { key: 'j', description: 'Rewind 10 seconds' },
        { key: 'l', description: 'Fast forward 10 seconds' },
        { key: '←', description: 'Seek backward 5 seconds' },
        { key: '→', description: 'Seek forward 5 seconds' },
        { key: '↑', description: 'Increase volume 5%' },
        { key: '↓', description: 'Decrease volume 5%' },
        { key: '0..9', description: 'Seek to point in video (0% to 90%)' },
        { key: '< (Shift + ,)', description: 'Decrease playback rate' },
        { key: '> (Shift + .)', description: 'Increase playback rate' },
        { key: 'm', description: 'Toggle mute / unmute' },
        { key: 'f', description: 'Toggle full screen' },
        { key: 'i', description: 'Toggle Picture-in-Picture miniplayer' },
        { key: 't', description: 'Toggle theater mode' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { key: '/', description: 'Go to search box' },
        { key: 'Esc', description: 'Close modal / player' },
        { key: 'Shift + / (?)', description: 'Open keyboard shortcuts dialog' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 id="shortcuts-modal-title" className="text-sm font-extrabold text-white tracking-wide uppercase font-mono">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs no-scrollbar bg-neutral-950">
          {groups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-neutral-300 tracking-wider">
                {group.title.toUpperCase()}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {group.shortcuts.map((s) => (
                  <div key={s.description} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-neutral-300">{s.description}</span>
                    <kbd className="px-2 py-1 bg-black border border-neutral-700 text-[11px] font-mono font-bold text-white rounded shadow-sm whitespace-nowrap">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3.5 bg-black border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-lg transition-colors font-mono uppercase tracking-wider"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
