import React from 'react';
import { X, Mic, Info, Cpu, Radio, ShieldAlert, Sparkles } from 'lucide-react';

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
                Audio Input Architecture & Guide
              </h2>
              <p className="text-xs text-slate-400">
                Understanding browser capture, virtual devices, and visualizer rendering
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

        {/* Section 1: Audio Capture Mechanism */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
            <Mic className="w-4 h-4" />
            <span>1. How Audio Capture Works</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            The application utilizes the browser&apos;s native <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">navigator.mediaDevices.getUserMedia()</code> API to open a high-fidelity input stream. This stream connects to a Web Audio API <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">AudioContext</code>, running an <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">AnalyserNode</code> that extracts realtime frequency spectrum (FFT) data without recording or sending audio anywhere.
          </p>
        </div>

        {/* Section 2: Virtual Audio Devices */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-semibold text-sm">
            <Radio className="w-4 h-4" />
            <span>2. Using Virtual Audio Drivers (SteelSeries Sonar, Stereo Mix, VB-Cable)</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            Virtual audio software creates software-based recording endpoints on your operating system. For example, software like <strong>SteelSeries Sonar</strong>, <strong>VB-Audio VoiceMeeter / Cable</strong>, or Windows <strong>Stereo Mix</strong> loop your system sound output back into a virtual input device that browsers like Chrome or Brave can directly capture.
          </p>
        </div>

        {/* Section 3: Browser Security Limits */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>3. Why Arbitrary Speaker Endpoints Cannot Be Directly Intercepted</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            For security and privacy, web browsers do not allow JavaScript to eavesdrop on raw system speaker output drivers without explicit hardware/virtual driver exposure. If a virtual audio cable is not configured, select your system microphone or enable the built-in <strong>Demo Synth Beat</strong> mode.
          </p>
        </div>

        {/* Section 4: Visualizer Engine & Safety */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-pink-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>4. Visualizer Engine & Measurement Accuracy</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            The visualizer engine maps raw frequency bins to low-frequency Bass (20-250Hz), Midrange (250-4000Hz), and Treble (4000-20000Hz) energy values. 
            <br />
            <em className="text-slate-400 text-xs">Note: This tool is an ambient visual experience, not a calibrated acoustic dBFS or loudness meter. Amplitude heights represent relative graphic intensity.</em>
          </p>
        </div>

        {/* Section 5: Performance Mode Optimization */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
            <Cpu className="w-4 h-4" />
            <span>5. Low Performance Mode & FPS Throttling</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pl-6">
            To prevent overheating on low-spec laptops, selecting <strong>Low Quality</strong> or <strong>30 FPS</strong> throttles requestAnimationFrame loops, lowers particle allocations, disables heavy blur/shadow filters, and simplifies FFT bin calculations.
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
