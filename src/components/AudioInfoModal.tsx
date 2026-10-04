import React from 'react';
import { X, Monitor, Info, Cpu, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';

interface AudioInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioInfoModal: React.FC<AudioInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 text-slate-200 overflow-y-auto shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Screen Audio Sharing Guide
              </h2>
              <p className="text-xs text-slate-400">
                How system & tab audio capture works in Ambient Flip Visualizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Screen Audio Capture */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
            <Monitor className="w-4 h-4" />
            <span>1. How Screen Audio Capture Works</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            The application requests screen sharing using <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">navigator.mediaDevices.getDisplayMedia()</code>. When you select a tab, window, or screen and enable <strong>&quot;Share audio&quot;</strong>, the app extracts <strong>ONLY the audio track</strong> and immediately discards video frames.
          </p>
        </div>

        {/* Section 2: Video Discarding */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-semibold text-sm">
            <Volume2 className="w-4 h-4" />
            <span>2. Video Frames Are Never Rendered</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            No video streams are displayed, stored, or processed. Video tracks are stopped instantly upon capture to conserve 100% of CPU/GPU resources for the ambient visualizer.
          </p>
        </div>

        {/* Section 3: Audio Check Requirement */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>3. Enabling &quot;Share Audio&quot; in Browser Dialog</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            If a screen or tab is shared without checking the <strong>&quot;Share audio&quot;</strong> toggle in the browser prompt, the capture fails and prompts you to share again with audio enabled.
          </p>
        </div>

        {/* Section 4: Performance & Safety */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-pink-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>4. Visualizer Spectrum & Sensitivity</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            The Web Audio API <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">AnalyserNode</code> analyzes frequency spectrum bins in realtime. You can adjust master sensitivity and frequency band scales in the Audio settings tab.
          </p>
        </div>

        {/* Footer button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
