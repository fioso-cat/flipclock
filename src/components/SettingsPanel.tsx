import React, { useState } from 'react';
import {
  Clock as ClockIcon,
  Mic,
  Palette,
  Sparkles,
  Sliders,
  Cpu,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
  Keyboard as KeyboardIcon,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  AppSettings,
  AudioDeviceInfo,
  VisualizerPresetId,
  ColorThemeId,
  ClockPosition,
  VisualizerPosition,
  ClockFontFamily,
  QualityPreset,
  TargetFPS,
} from '../types';
import { COLOR_THEMES } from '../utils/color-palettes';

interface SettingsPanelProps {
  settings: AppSettings;
  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  resetSettings: () => void;
  audioDevices: AudioDeviceInfo[];
  refreshAudioDevices: () => void;
  audioStatus: 'idle' | 'capturing' | 'silent' | 'denied' | 'unavailable';
  currentDeviceLabel: string;
  errorMessage: string | null;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  openAudioInfo: () => void;
  openShortcuts: () => void;
  openFontBrowser: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const PRESET_LIST: { id: VisualizerPresetId; label: string; icon: string }[] = [
  { id: 'galaxy', label: 'Galaxy', icon: '🌌' },
  { id: 'ocean', label: 'Ocean', icon: '🌊' },
  { id: 'sunshine', label: 'Sunshine', icon: '☀️' },
  { id: 'aurora', label: 'Aurora', icon: '✨' },
  { id: 'neon', label: 'Neon Grid', icon: '🌆' },
  { id: 'cosmic', label: 'Cosmic Dust', icon: '💫' },
  { id: 'fire', label: 'Inferno Fire', icon: '🔥' },
  { id: 'matrix', label: 'Matrix Rain', icon: '📟' },
  { id: 'particle', label: 'Swarm Field', icon: '🪐' },
  { id: 'radial', label: 'Radial Ring', icon: '🎯' },
  { id: 'wave', label: 'Fluid Wave', icon: '〰️' },
  { id: 'spectrum', label: 'Spectrum Bars', icon: '📊' },
  { id: 'oscilloscope', label: 'Oscilloscope', icon: '📈' },
  { id: 'starfield', label: '3D Starfield', icon: '⭐' },
  { id: 'fluid', label: 'Organic Fluid', icon: '💧' },
  { id: 'vortex', label: 'Dark Vortex', icon: '🌀' },
  { id: 'rain', label: 'Neon Rain', icon: '🌧️' },
  { id: 'plasma', label: 'Sine Plasma', icon: '🎨' },
  { id: 'digital', label: 'Digital VFD', icon: '📟' },
  { id: 'minimal', label: 'Zen Minimal', icon: '⭕' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  updateSettings,
  resetSettings,
  audioDevices,
  refreshAudioDevices,
  audioStatus,
  currentDeviceLabel,
  errorMessage,
  isFullscreen,
  toggleFullscreen,
  openAudioInfo,
  openShortcuts,
  openFontBrowser,
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'clock' | 'audio' | 'visualizer' | 'color' | 'background' | 'performance' | 'general'
  >('visualizer');

  if (!isVisible) return null;

  const tabs = [
    { id: 'clock', label: 'Clock', icon: ClockIcon },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'visualizer', label: 'Visualizer', icon: Sparkles },
    { id: 'color', label: 'Colors', icon: Palette },
    { id: 'background', label: 'Background', icon: Sliders },
    { id: 'performance', label: 'Performance', icon: Cpu },
    { id: 'general', label: 'General', icon: SettingsIcon },
  ];

  return (
    <div className="fixed top-4 right-4 z-40 w-full max-w-md max-h-[90vh] bg-slate-950/85 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-200 overflow-hidden animate-slideIn">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold text-white tracking-wider uppercase">
            Ambient Controls
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            title="Hide UI (H)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center overflow-x-auto scrollbar-none px-3 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* ================= CLOCK TAB ================= */}
        {activeTab === 'clock' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              Display & Format
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>24-Hour Format</span>
                <input
                  type="checkbox"
                  checked={settings.clock.use24Hour}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      clock: { ...prev.clock, use24Hour: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Show Seconds</span>
                <input
                  type="checkbox"
                  checked={settings.clock.showSeconds}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      clock: { ...prev.clock, showSeconds: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Milliseconds</span>
                <input
                  type="checkbox"
                  checked={settings.clock.showMilliseconds}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      clock: { ...prev.clock, showMilliseconds: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Show Date</span>
                <input
                  type="checkbox"
                  checked={settings.clock.showDate}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      clock: { ...prev.clock, showDate: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 pt-2">
              Aesthetics & Typography
            </h3>

            <button
              onClick={openFontBrowser}
              className="w-full py-2.5 px-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold rounded-xl flex items-center justify-between transition-all shadow"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Browse Typography Library</span>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </button>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
              <span>3D Flip Card Effect</span>
              <input
                type="checkbox"
                checked={settings.clock.flipStyle}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    clock: { ...prev.clock, flipStyle: e.target.checked },
                  }))
                }
                className="accent-cyan-400"
              />
            </label>

            <div>
              <div className="flex justify-between mb-1">
                <span>Font Size</span>
                <span className="text-cyan-400">{settings.clock.fontSize}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={settings.clock.fontSize}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    clock: { ...prev.clock, fontSize: parseFloat(e.target.value) },
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Clock Opacity</span>
                <span className="text-cyan-400">{Math.round(settings.clock.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.clock.opacity}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    clock: { ...prev.clock, opacity: parseFloat(e.target.value) },
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-300">Clock Position</label>
              <select
                value={settings.clock.position}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    clock: { ...prev.clock, position: e.target.value as ClockPosition },
                  }))
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="center">Center</option>
                <option value="top">Upper Center</option>
                <option value="bottom">Lower Center</option>
                <option value="custom">Custom Position</option>
              </select>
            </div>

            {settings.clock.position === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <span className="block mb-1">X Position (%)</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={settings.clock.customX}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        clock: { ...prev.clock, customX: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <span className="block mb-1">Y Position (%)</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={settings.clock.customY}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        clock: { ...prev.clock, customY: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= AUDIO TAB ================= */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Input Source
              </h3>
              <button
                onClick={openAudioInfo}
                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors text-[11px]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Audio Device Guide</span>
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() =>
                  updateSettings((prev) => ({
                    ...prev,
                    audio: { ...prev.audio, mode: 'mic' },
                  }))
                }
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  settings.audio.mode === 'mic'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Device / Mic
              </button>
              <button
                onClick={() =>
                  updateSettings((prev) => ({
                    ...prev,
                    audio: { ...prev.audio, mode: 'demo_synth' },
                  }))
                }
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  settings.audio.mode === 'demo_synth'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Built-in Synth Demo
              </button>
            </div>

            {/* Audio Device Dropdown */}
            {settings.audio.mode === 'mic' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Select Capture Device</label>
                  <button
                    onClick={refreshAudioDevices}
                    title="Refresh device list"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  value={settings.audio.deviceId}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, deviceId: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Audio Source --</option>
                  <option value="default">Default System Microphone</option>
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>

                {/* Status Indicator */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Capture Status:</span>
                    <span className="font-semibold flex items-center space-x-1.5">
                      {audioStatus === 'capturing' && (
                        <span className="text-emerald-400 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                          ● Capturing
                        </span>
                      )}
                      {audioStatus === 'silent' && <span className="text-yellow-400">○ Low Audio Signal</span>}
                      {audioStatus === 'denied' && <span className="text-red-400">⚠ Permission Denied</span>}
                      {audioStatus === 'unavailable' && <span className="text-red-400">⚠ Device Unavailable</span>}
                      {audioStatus === 'idle' && <span className="text-slate-400">○ Idle</span>}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Active: <span className="text-cyan-300">{currentDeviceLabel}</span>
                  </div>
                  {errorMessage && (
                    <div className="text-[11px] text-red-400 bg-red-950/40 p-2 rounded-lg mt-1 border border-red-900/50">
                      {errorMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audio Sensitivity & Gain */}
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 pt-2">
              Sensitivity & Bands
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span>Master Sensitivity</span>
                <span className="text-cyan-400">{settings.audio.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={settings.audio.sensitivity}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    audio: { ...prev.audio, sensitivity: parseFloat(e.target.value) },
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block mb-1 text-[11px]">Bass (Sub)</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.audio.bassSens}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, bassSens: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <span className="block mb-1 text-[11px]">Midrange</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.audio.midSens}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, midSens: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <span className="block mb-1 text-[11px]">Treble</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.audio.trebleSens}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, trebleSens: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">FFT Size</label>
                <select
                  value={settings.audio.fftSize}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, fftSize: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none"
                >
                  <option value={512}>512 Bins</option>
                  <option value={1024}>1024 Bins (Default)</option>
                  <option value={2048}>2048 Bins (High Res)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Smoothing Constant</label>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={settings.audio.smoothing}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      audio: { ...prev.audio, smoothing: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400 mt-2"
                />
              </div>
            </div>

            <button
              onClick={() =>
                updateSettings((prev) => ({
                  ...prev,
                  audio: { ...prev.audio, isMuted: !prev.audio.isMuted },
                }))
              }
              className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all ${
                settings.audio.isMuted
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {settings.audio.isMuted ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Unmute Audio Capture</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Mute Audio Input (M)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================= VISUALIZER TAB ================= */}
        {activeTab === 'visualizer' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              Select Preset
            </h3>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {PRESET_LIST.map((p) => {
                const isSelected = settings.visualizer.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        visualizer: { ...prev.visualizer, preset: p.id },
                      }))
                    }
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 pt-2">
              Transform & Geometry
            </h3>

            <div>
              <label className="block mb-1 text-slate-300">Visualizer Position</label>
              <select
                value={settings.visualizer.position}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    visualizer: {
                      ...prev.visualizer,
                      position: e.target.value as VisualizerPosition,
                    },
                  }))
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none"
              >
                <option value="center">Center (Default)</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="custom">Custom Position</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Scale</span>
                  <span className="text-cyan-400">{settings.visualizer.scale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.visualizer.scale}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      visualizer: { ...prev.visualizer, scale: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Intensity</span>
                  <span className="text-cyan-400">{settings.visualizer.intensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.visualizer.intensity}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      visualizer: { ...prev.visualizer, intensity: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
              <span>Mirror Symmetry</span>
              <input
                type="checkbox"
                checked={settings.visualizer.mirror}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    visualizer: { ...prev.visualizer, mirror: e.target.checked },
                  }))
                }
                className="accent-cyan-400"
              />
            </label>
          </div>
        )}

        {/* ================= COLOR TAB ================= */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              Color Theme
            </h3>

            <select
              value={settings.color.theme}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  color: { ...prev.color, theme: e.target.value as ColorThemeId },
                }))
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500 font-semibold"
            >
              {Object.entries(COLOR_THEMES).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Custom 4 Color Stops */}
            {settings.color.theme === 'custom' && (
              <div className="space-y-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="block font-semibold text-slate-300">Custom Gradient Palette</span>
                <div className="grid grid-cols-4 gap-2">
                  {settings.color.customColors.map((c, idx) => (
                    <input
                      key={idx}
                      type="color"
                      value={c}
                      onChange={(e) => {
                        const newColors = [...settings.color.customColors];
                        newColors[idx] = e.target.value;
                        updateSettings((prev) => ({
                          ...prev,
                          color: { ...prev.color, customColors: newColors },
                        }));
                      }}
                      className="w-full h-9 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 pt-2">
              Color Adjustments
            </h3>

            <div>
              <div className="flex justify-between mb-1">
                <span>Glow Intensity</span>
                <span className="text-cyan-400">{settings.color.glowIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.color.glowIntensity}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    color: { ...prev.color, glowIntensity: parseInt(e.target.value) },
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        )}

        {/* ================= BACKGROUND TAB ================= */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              Audio-Reactive Background
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Bass Scale Pulse</span>
                <input
                  type="checkbox"
                  checked={settings.background.reactiveScale}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      background: { ...prev.background, reactiveScale: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Mid Frequency Gradient Motion</span>
                <input
                  type="checkbox"
                  checked={settings.background.reactiveGradient}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      background: { ...prev.background, reactiveGradient: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Treble Particles Shimmer</span>
                <input
                  type="checkbox"
                  checked={settings.background.reactiveParticles}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      background: { ...prev.background, reactiveParticles: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
                <span>Overall Energy Ambient Glow</span>
                <input
                  type="checkbox"
                  checked={settings.background.reactiveBrightness}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      background: { ...prev.background, reactiveBrightness: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </label>
            </div>
          </div>
        )}

        {/* ================= PERFORMANCE TAB ================= */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              Rendering Quality
            </h3>

            <div>
              <span className="block mb-2 font-medium">Quality Preset</span>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as QualityPreset[]).map((q) => (
                  <button
                    key={q}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        performance: {
                          ...prev.performance,
                          quality: q,
                          particleDensity: q === 'low' ? 0.4 : q === 'medium' ? 1.0 : 1.5,
                        },
                      }))
                    }
                    className={`py-2 rounded-xl font-bold uppercase transition-all ${
                      settings.performance.quality === q
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block mb-2 font-medium">Target FPS (Frame Rate)</span>
              <div className="grid grid-cols-3 gap-2">
                {([30, 45, 60] as TargetFPS[]).map((fps) => (
                  <button
                    key={fps}
                    onClick={() =>
                      updateSettings((prev) => ({
                        ...prev,
                        performance: { ...prev.performance, fps },
                      }))
                    }
                    className={`py-2 rounded-xl font-bold transition-all ${
                      settings.performance.fps === fps
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Particle Density</span>
                <span className="text-cyan-400">
                  {Math.round(settings.performance.particleDensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={settings.performance.particleDensity}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    performance: {
                      ...prev.performance,
                      particleDensity: parseFloat(e.target.value),
                    },
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        )}

        {/* ================= GENERAL TAB ================= */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              UI Behavior & Hotkeys
            </h3>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
              <span>Auto-Hide Controls On Inactivity</span>
              <input
                type="checkbox"
                checked={settings.autoHideUI}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    autoHideUI: e.target.checked,
                  }))
                }
                className="accent-cyan-400"
              />
            </label>

            {settings.autoHideUI && (
              <div>
                <div className="flex justify-between mb-1">
                  <span>Auto-Hide Timeout</span>
                  <span className="text-cyan-400">{settings.uiTimeoutSeconds}s</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={settings.uiTimeoutSeconds}
                  onChange={(e) =>
                    updateSettings((prev) => ({
                      ...prev,
                      uiTimeoutSeconds: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>
            )}

            <button
              onClick={openShortcuts}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <KeyboardIcon className="w-4 h-4" />
              <span>Keyboard Shortcuts Reference</span>
            </button>

            <button
              onClick={resetSettings}
              className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-900/50 text-red-300 font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Settings To Default</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-300">H</kbd> to toggle panel</span>
        <span>Preset: <strong className="text-white capitalize">{settings.visualizer.preset}</strong></span>
      </div>
    </div>
  );
};
