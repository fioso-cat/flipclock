export type VisualizerPresetId =
  | 'ocean'
  | 'sunshine'
  | 'galaxy'
  | 'aurora'
  | 'neon'
  | 'cosmic'
  | 'fire'
  | 'matrix'
  | 'particle'
  | 'radial'
  | 'wave'
  | 'spectrum'
  | 'oscilloscope'
  | 'starfield'
  | 'fluid'
  | 'vortex'
  | 'rain'
  | 'plasma'
  | 'digital'
  | 'minimal';

export type ColorThemeId =
  | 'ocean'
  | 'sunshine'
  | 'galaxy'
  | 'aurora'
  | 'neon'
  | 'fire'
  | 'purple'
  | 'blue'
  | 'cyan'
  | 'pink'
  | 'monochrome'
  | 'white'
  | 'rainbow'
  | 'sunset'
  | 'custom';

export type ClockPosition = 'center' | 'top' | 'bottom' | 'custom';
export type VisualizerPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom';
export type QualityPreset = 'high' | 'medium' | 'low';
export type TargetFPS = 30 | 45 | 60;
export type ClockFontFamily = string;

export interface ClockSettings {
  use24Hour: boolean;
  showSeconds: boolean;
  showMilliseconds: boolean;
  showDate: boolean;
  fontSize: number; // in rem or px multiplier (e.g. 1 to 5)
  opacity: number; // 0.1 to 1.0
  letterSpacing: number; // in px or em
  fontFamily: string; // font ID e.g. "orbitron", "jetbrains-mono"
  fontWeight: number; // 300, 400, 500, 600, 700, 800, 900
  fontStyle: 'normal' | 'italic';
  glow: boolean;
  glowIntensity: number;
  blur: number; // in px
  flipStyle: boolean; // flip card transition style vs digital text
  position: ClockPosition;
  customX: number; // percentage 0-100
  customY: number; // percentage 0-100
  favorites: string[]; // font IDs
  recentFonts: string[]; // font IDs
}

export interface AudioSettings {
  deviceId: string;
  gain: number; // 0.1 to 3.0
  sensitivity: number; // 0.5 to 3.0
  fftSize: number; // 256, 512, 1024, 2048, 4096
  smoothing: number; // 0.1 to 0.95
  bassSens: number; // 0.5 to 3.0
  midSens: number; // 0.5 to 3.0
  trebleSens: number; // 0.5 to 3.0
  isMuted: boolean;
  mode: 'mic' | 'demo_synth' | 'audio_file';
  demoTrackName?: string;
}

export interface VisualizerSettings {
  preset: VisualizerPresetId;
  position: VisualizerPosition;
  scale: number; // 0.5 to 2.0
  speed: number; // 0.5 to 2.0
  intensity: number; // 0.5 to 3.0
  mirror: boolean;
  customX: number;
  customY: number;
}

export interface ColorSettings {
  theme: ColorThemeId;
  customColors: string[]; // 4 hex colors
  saturation: number; // 0 to 200%
  brightness: number; // 0 to 200%
  glowIntensity: number; // 0 to 100
  gradientAngle: number; // 0 to 360
}

export interface BackgroundSettings {
  reactiveScale: boolean;
  reactiveGradient: boolean;
  reactiveParticles: boolean;
  reactiveBrightness: boolean;
  baseOpacity: number;
}

export interface PerformanceSettings {
  quality: QualityPreset;
  fps: TargetFPS;
  particleDensity: number; // 0.2 to 2.0
  resolutionScale: number; // 0.5 to 1.0
}

export interface AppSettings {
  clock: ClockSettings;
  audio: AudioSettings;
  visualizer: VisualizerSettings;
  color: ColorSettings;
  background: BackgroundSettings;
  performance: PerformanceSettings;
  autoHideUI: boolean;
  uiTimeoutSeconds: number;
}

export interface AudioAnalysis {
  bass: number; // 0.0 - 1.0 normalized & smoothed energy
  mid: number; // 0.0 - 1.0
  treble: number; // 0.0 - 1.0
  overallEnergy: number; // 0.0 - 1.0
  peakFreq: number; // peak frequency in Hz
  avgFreq: number; // average frequency value
  rawFrequencyData: Uint8Array;
  rawTimeDomainData: Uint8Array;
  isAudioActive: boolean;
}

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  deltaTime: number;
  audio: AudioAnalysis;
  vSettings: VisualizerSettings;
  cSettings: ColorSettings;
  pSettings: PerformanceSettings;
  palette: ColorPalette;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  bgDark: string;
  gradientStops: string[];
}
