import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F', desc: 'Toggle Fullscreen Mode' },
    { key: 'H', desc: 'Show / Hide Settings UI' },
    { key: 'Space', desc: 'Pause / Resume Visualizer' },
    { key: '← / →', desc: 'Cycle Previous / Next Visualizer Preset' },
    { key: '↑ / ↓', desc: 'Increase / Decrease Visualizer Intensity' },
    { key: 'M', desc: 'Mute / Unmute Audio Capture Input' },
    { key: '1 - 9', desc: 'Jump to Visualizer Presets 1 through 9' },
    { key: 'ESC', desc: 'Exit Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 text-slate-200 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Keyboard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Table */}
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <span className="text-sm font-medium text-slate-300">{s.desc}</span>
              <kbd className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-xs font-mono text-cyan-300 shadow">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
