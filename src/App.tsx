import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppSettings,
  AudioAnalysis,
  AudioDeviceInfo,
  VisualizerPresetId,
} from './types';
import { Clock } from './components/Clock';
import { SettingsPanel } from './components/SettingsPanel';
import { AudioInfoModal } from './components/AudioInfoModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { FontBrowserModal } from './components/FontBrowserModal';
import { AudioManager } from './utils/audio-manager';
import { getColorPalette, rgba } from './utils/color-palettes';
import { renderVisualizer } from './visualizers/presets';
import {
  Monitor,
  Mic,
  Sliders,
  Play,
  Pause,
  HelpCircle,
  Keyboard as KeyboardIcon,
  Type,
} from 'lucide-react';

const STORAGE_KEY = 'ambient_flip_visualizer_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  clock: {
    use24Hour: true,
    showSeconds: true,
    showMilliseconds: false,
    showDate: false,
    fontSize: 1.2,
    opacity: 0.85,
    letterSpacing: 4,
    fontFamily: 'orbitron',
    fontWeight: 700,
    fontStyle: 'normal',
    glow: true,
    glowIntensity: 0.8,
    blur: 0,
    flipStyle: true,
    position: 'center',
    customX: 50,
    customY: 50,
    favorites: ['orbitron', 'jetbrains-mono', 'share-tech-mono'],
    recentFonts: ['orbitron'],
  },
  audio: {
    deviceId: 'default',
    gain: 1.0,
    sensitivity: 1.2,
    fftSize: 1024,
    smoothing: 0.75,
    bassSens: 1.2,
    midSens: 1.0,
    trebleSens: 1.0,
    isMuted: false,
    mode: 'screen_audio',
  },
  visualizer: {
    preset: 'jupiter',
    position: 'center',
    scale: 1.0,
    speed: 1.0,
    intensity: 1.2,
    mirror: false,
    customX: 50,
    customY: 50,
  },
  color: {
    theme: 'galaxy',
    customColors: ['#240046', '#5a189a', '#7b2cbf', '#9d4edd'],
    saturation: 100,
    brightness: 100,
    glowIntensity: 80,
    gradientAngle: 45,
  },
  background: {
    reactiveScale: true,
    reactiveGradient: true,
    reactiveParticles: true,
    reactiveBrightness: true,
    baseOpacity: 0.2,
  },
  performance: {
    quality: 'medium',
    fps: 30,
    particleDensity: 1.0,
    resolutionScale: 1.0,
  },
  autoHideUI: true,
  uiTimeoutSeconds: 4,
};

const PRESETS_ARRAY: VisualizerPresetId[] = [
  'synthwave',
  'solar_system',
  'mars',
  'jupiter',
  'saturn',
  'neptune',
  'supernova',
  'eclipse',
  'blackhole',
  'pulsar',
  'exoplanet',
  'galaxy',
  'ocean',
  'sunshine',
  'aurora',
  'neon',
  'cosmic',
  'fire',
  'matrix',
  'particle',
  'radial',
  'wave',
  'spectrum',
  'oscilloscope',
  'starfield',
  'fluid',
  'vortex',
  'rain',
  'plasma',
  'digital',
  'minimal',
];

export default function App() {
  // Saved Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse localStorage settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // UI Visibility States
  const [isUIVisible, setIsUIVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isAudioInfoOpen, setIsAudioInfoOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isFontBrowserOpen, setIsFontBrowserOpen] = useState<boolean>(false);

  // Audio Manager
  const audioManagerRef = useRef<AudioManager | null>(null);
  const [audioDevices, setAudioDevices] = useState<AudioDeviceInfo[]>([]);
  const [audioStatus, setAudioStatus] = useState<
    'idle' | 'capturing' | 'silent' | 'denied' | 'unavailable'
  >('idle');
  const [currentDeviceLabel, setCurrentDeviceLabel] = useState<string>('Audio disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Canvas Refs & Loop Timers
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Save Settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  // Instantiate Audio Manager
  useEffect(() => {
    const manager = new AudioManager();
    audioManagerRef.current = manager;

    const fetchDevices = async () => {
      const list = await manager.getAudioDevices();
      setAudioDevices(list);
    };

    fetchDevices();

    const syncStatus = () => {
      setAudioStatus(manager.status);
      setCurrentDeviceLabel(manager.currentDeviceLabel);
      setErrorMessage(manager.errorMessage);
    };

    manager.setOnStatusChangeListener(syncStatus);

    return () => {
      manager.destroy();
    };
  }, []);

  const refreshAudioDevices = async () => {
    if (audioManagerRef.current) {
      const list = await audioManagerRef.current.getAudioDevices();
      setAudioDevices(list);
    }
  };

  // Update Audio Stream when audio settings change
  const reinitAudio = useCallback(async () => {
    if (!audioManagerRef.current) return;
    const mgr = audioManagerRef.current;
    await mgr.initAudio(settings.audio);
    setAudioStatus(mgr.status);
    setCurrentDeviceLabel(mgr.currentDeviceLabel);
    setErrorMessage(mgr.errorMessage);
  }, [settings.audio]);

  useEffect(() => {
    reinitAudio();
  }, [settings.audio.mode, reinitAudio]);

  // Update Gain / Smoothing dynamically
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.updateSettings(settings.audio);
    }
  }, [settings.audio]);

  const handleStartScreenAudio = async () => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.startScreenAudio(settings.audio);
      setAudioStatus(audioManagerRef.current.status);
      setCurrentDeviceLabel(audioManagerRef.current.currentDeviceLabel);
      setErrorMessage(audioManagerRef.current.errorMessage);
    }
  };

  const handleStartMicAudio = async () => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.startMicAudio(settings.audio);
      setAudioStatus(audioManagerRef.current.status);
      setCurrentDeviceLabel(audioManagerRef.current.currentDeviceLabel);
      setErrorMessage(audioManagerRef.current.errorMessage);
    }
  };

  const handleStopAudio = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
      setAudioStatus(audioManagerRef.current.status);
      setCurrentDeviceLabel(audioManagerRef.current.currentDeviceLabel);
      setErrorMessage(audioManagerRef.current.errorMessage);
    }
  };

  // Fullscreen Change Sync
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Right-Click Context Menu listener to toggle UI
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (
        (e.target as HTMLElement)?.closest('.settings-panel-container') ||
        (e.target as HTMLElement)?.closest('input')
      ) {
        return;
      }
      e.preventDefault();
      setIsUIVisible((prev) => !prev);
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        if (e.key === 'Escape') {
          setIsFontBrowserOpen(false);
          setIsAudioInfoOpen(false);
          setIsShortcutsOpen(false);
        }
        return;
      }

      const key = e.key.toUpperCase();

      if (e.key === 'Escape') {
        if (isFontBrowserOpen) setIsFontBrowserOpen(false);
        else if (isAudioInfoOpen) setIsAudioInfoOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (!document.fullscreenElement) {
          setIsUIVisible((prev) => !prev);
        }
      } else if (key === 'H') {
        setIsUIVisible((prev) => !prev);
      } else if (key === 'F') {
        toggleFullscreen();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (key === 'M') {
        setSettings((prev) => ({
          ...prev,
          audio: { ...prev.audio, isMuted: !prev.audio.isMuted },
        }));
      } else if (e.key === 'ArrowRight') {
        const currIndex = PRESETS_ARRAY.indexOf(settings.visualizer.preset);
        const nextPreset = PRESETS_ARRAY[(currIndex + 1) % PRESETS_ARRAY.length];
        setSettings((prev) => ({
          ...prev,
          visualizer: { ...prev.visualizer, preset: nextPreset },
        }));
      } else if (e.key === 'ArrowLeft') {
        const currIndex = PRESETS_ARRAY.indexOf(settings.visualizer.preset);
        const prevPreset =
          PRESETS_ARRAY[(currIndex - 1 + PRESETS_ARRAY.length) % PRESETS_ARRAY.length];
        setSettings((prev) => ({
          ...prev,
          visualizer: { ...prev.visualizer, preset: prevPreset },
        }));
      } else if (e.key === 'ArrowUp') {
        setSettings((prev) => ({
          ...prev,
          visualizer: {
            ...prev.visualizer,
            intensity: Math.min(3.0, prev.visualizer.intensity + 0.2),
          },
        }));
      } else if (e.key === 'ArrowDown') {
        setSettings((prev) => ({
          ...prev,
          visualizer: {
            ...prev.visualizer,
            intensity: Math.max(0.5, prev.visualizer.intensity - 0.2),
          },
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.visualizer.preset,
    isFontBrowserOpen,
    isAudioInfoOpen,
    isShortcutsOpen,
  ]);

  // Main Render Loop with FPS Throttling
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let startTime = performance.now();

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      if (isPaused) return;

      // Target FPS throttling
      const targetFps = settings.performance.fps || 30;
      const interval = 1000 / targetFps;
      const elapsed = now - lastFrameTimeRef.current;

      if (elapsed < interval) return;
      lastFrameTimeRef.current = now - (elapsed % interval);

      // Handle Resolution Scale & Canvas Resize
      const resScale = settings.performance.resolutionScale || 1.0;
      const targetW = Math.floor(window.innerWidth * resScale);
      const targetH = Math.floor(window.innerHeight * resScale);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      // Analyze Audio Frame
      const audioAnalysis: AudioAnalysis = audioManagerRef.current
        ? audioManagerRef.current.analyze(settings.audio)
        : {
            bass: 0,
            mid: 0,
            treble: 0,
            overallEnergy: 0,
            peakFreq: 0,
            avgFreq: 0,
            rawFrequencyData: new Uint8Array(0),
            rawTimeDomainData: new Uint8Array(0),
            isAudioActive: false,
          };

      const palette = getColorPalette(settings.color);
      const timeInSec = (now - startTime) / 1000;

      // Clear Canvas Frame
      ctx.save();
      ctx.fillStyle = palette.bgDark || '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Audio-reactive background radial bloom
      if (settings.background.reactiveBrightness) {
        const bgGlowRadius = Math.max(
          0,
          Math.max(canvas.width, canvas.height) * 0.8
        );
        const bgGrad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          10,
          canvas.width / 2,
          canvas.height / 2,
          bgGlowRadius
        );
        bgGrad.addColorStop(
          0,
          rgba(palette.primary, 0.2 + audioAnalysis.overallEnergy * 0.3)
        );
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render Active Visualizer Preset
      renderVisualizer({
        ctx,
        width: canvas.width,
        height: canvas.height,
        time: timeInSec,
        deltaTime: elapsed / 1000,
        audio: audioAnalysis,
        vSettings: settings.visualizer,
        cSettings: settings.color,
        pSettings: settings.performance,
        palette,
      });

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [settings, isPaused]);

  const palette = getColorPalette(settings.color);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* Visualizer Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Foreground Ambient Flip Clock */}
      <Clock settings={settings.clock} colorGlow={palette.accent} />

      {/* Floating Audio Setup Banner when disconnected - ONLY WHEN UI IS VISIBLE */}
      {isUIVisible && audioStatus !== 'capturing' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-2xl animate-bounce max-w-[92vw]">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">Select Audio Source:</span>
          </div>

          <button
            onClick={handleStartScreenAudio}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors shadow flex items-center space-x-1"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Screen Audio</span>
          </button>

          <button
            onClick={handleStartMicAudio}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow flex items-center space-x-1"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Microphone (Mobile & PC)</span>
          </button>

          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                audio: { ...prev.audio, mode: 'demo_synth' },
              }))
            }
            className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition-colors shadow"
          >
            Demo Synth
          </button>
        </div>
      )}

      {/* Floating Bottom Minimal Controls Pill - VISIBLE ONLY WHEN isUIVisible IS TRUE */}
      {isUIVisible && (
        <div className="fixed bottom-4 left-4 z-30 flex items-center space-x-2 px-3 py-2 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 transition-opacity duration-300">
          <button
            onClick={() => setIsFontBrowserOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 transition-colors"
            title="Fonts & Typography Library"
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsUIVisible((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Hide Controls Panel (H)"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Pause / Resume Visualizer (Space)"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Keyboard Shortcuts"
          >
            <KeyboardIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAudioInfoOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Audio Capture Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 my-auto" />

          <span className="text-xs font-semibold text-slate-300 px-1 capitalize">
            {settings.visualizer.preset}
          </span>
        </div>
      )}

      {/* Floating Settings Sidebar / Panel */}
      <SettingsPanel
        settings={settings}
        updateSettings={setSettings}
        resetSettings={() => setSettings(DEFAULT_SETTINGS)}
        audioStatus={audioStatus}
        currentDeviceLabel={currentDeviceLabel}
        errorMessage={errorMessage}
        audioDevices={audioDevices}
        refreshAudioDevices={refreshAudioDevices}
        onStartScreenAudio={handleStartScreenAudio}
        onStartMicAudio={handleStartMicAudio}
        onStopAudio={handleStopAudio}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        openAudioInfo={() => setIsAudioInfoOpen(true)}
        openShortcuts={() => setIsShortcutsOpen(true)}
        openFontBrowser={() => setIsFontBrowserOpen(true)}
        isVisible={isUIVisible}
        onClose={() => setIsUIVisible(false)}
      />

      {/* Typography Font Browser Modal */}
      <FontBrowserModal
        isOpen={isFontBrowserOpen}
        onClose={() => setIsFontBrowserOpen(false)}
        clockSettings={settings.clock}
        updateClockSettings={(updater) =>
          setSettings((prev) => ({
            ...prev,
            clock: updater(prev.clock),
          }))
        }
      />

      {/* Info Modals */}
      <AudioInfoModal
        isOpen={isAudioInfoOpen}
        onClose={() => setIsAudioInfoOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
