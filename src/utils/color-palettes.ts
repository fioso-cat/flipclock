import { ColorSettings, ColorPalette, ColorThemeId } from '../types';

export const COLOR_THEMES: Record<ColorThemeId, { name: string; stops: string[]; description: string }> = {
  ocean: {
    name: 'Ocean Deep',
    stops: ['#002b49', '#005f73', '#0a9396', '#94d2bd'],
    description: 'Deep azure blue and cyan ocean tones',
  },
  sunshine: {
    name: 'Solar Sunshine',
    stops: ['#ffb703', '#fb8500', '#d4a373', '#ffedd5'],
    description: 'Warm glowing gold, amber and sunburst rays',
  },
  galaxy: {
    name: 'Galactic Void',
    stops: ['#240046', '#5a189a', '#7b2cbf', '#9d4edd'],
    description: 'Deep cosmic purple, ultraviolet and starlight',
  },
  aurora: {
    name: 'Northern Aurora',
    stops: ['#05291e', '#00fb82', '#00b4d8', '#7209b7'],
    description: 'Ethereal emerald green and violet polar curtains',
  },
  neon: {
    name: 'Cyber Neon',
    stops: ['#03045e', '#00b4d8', '#f72585', '#7209b7'],
    description: 'Vibrant cyberpunk neon cyan, magenta and blue',
  },
  fire: {
    name: 'Inferno Flame',
    stops: ['#370617', '#6a040f', '#dc2f02', '#ffba08'],
    description: 'Intense crimson red, fiery orange and yellow',
  },
  purple: {
    name: 'Velvet Purple',
    stops: ['#10002b', '#240046', '#e0aaff', '#c77dff'],
    description: 'Lush purple hues with soft ultraviolet glow',
  },
  blue: {
    name: 'Electric Blue',
    stops: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef'],
    description: 'Crisp electric cobalt and ice blue',
  },
  cyan: {
    name: 'Matrix Cyan',
    stops: ['#00202e', '#005052', '#008b8b', '#00ffff'],
    description: 'Futuristic aqua cyan and teal illumination',
  },
  pink: {
    name: 'Chrono Pink',
    stops: ['#4a001f', '#a10035', '#ff2e93', '#ff85a1'],
    description: 'Dreamy synthwave hot pink and magenta',
  },
  monochrome: {
    name: 'Monochrome Silver',
    stops: ['#121212', '#444444', '#888888', '#e0e0e0'],
    description: 'Minimal grayscale and polished chrome',
  },
  white: {
    name: 'Pure White',
    stops: ['#1a1a1a', '#666666', '#cccccc', '#ffffff'],
    description: 'High contrast clean white minimalism',
  },
  rainbow: {
    name: 'Spectral Rainbow',
    stops: ['#ff0055', '#ffaa00', '#00ffaa', '#0099ff'],
    description: 'Full spectral rainbow frequency distribution',
  },
  sunset: {
    name: 'Twilight Sunset',
    stops: ['#2d00f7', '#6b00f7', '#f70076', '#ff7b00'],
    description: 'Atmospheric evening twilight gradient',
  },
  custom: {
    name: 'Custom Palette',
    stops: ['#1e1e2e', '#89b4fa', '#f5c2e7', '#a6e3a1'],
    description: 'User configured 4-color custom scheme',
  },
};

export function getColorPalette(colorSettings: ColorSettings): ColorPalette {
  const theme = COLOR_THEMES[colorSettings.theme] || COLOR_THEMES.galaxy;
  const stops = colorSettings.theme === 'custom' && colorSettings.customColors.length >= 4
    ? colorSettings.customColors
    : theme.stops;

  return {
    primary: stops[2] || '#7b2cbf',
    secondary: stops[1] || '#5a189a',
    accent: stops[3] || '#9d4edd',
    bgDark: stops[0] || '#10002b',
    gradientStops: stops,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return { r: 120, g: 120, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Get an interpolated color along a palette stop array given ratio t (0..1)
 */
export function interpolatePalette(stops: string[], t: number): string {
  if (!stops || stops.length === 0) return '#ffffff';
  if (stops.length === 1) return stops[0];
  
  const clampedT = Math.max(0, Math.min(1, t));
  const segment = 1 / (stops.length - 1);
  const index = Math.min(Math.floor(clampedT / segment), stops.length - 2);
  const subT = (clampedT - index * segment) / segment;

  const c1 = hexToRgb(stops[index]);
  const c2 = hexToRgb(stops[index + 1]);

  const r = Math.round(c1.r + (c2.r - c1.r) * subT);
  const g = Math.round(c1.g + (c2.g - c1.g) * subT);
  const b = Math.round(c1.b + (c2.b - c1.b) * subT);

  return `rgb(${r}, ${g}, ${b})`;
}
