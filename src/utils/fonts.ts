export type FontCategory = 'all' | 'digital' | 'monospace' | 'modern' | 'futuristic' | 'serif' | 'custom';

export interface FontMeta {
  id: string;
  name: string;
  family: string;
  category: Exclude<FontCategory, 'all'>;
  categoryLabel: string;
  googleFontName?: string;
  supportedWeights: number[];
  supportsItalic: boolean;
  isCustom?: boolean;
}

export const FONT_LIBRARY: FontMeta[] = [
  // DIGITAL / CLOCK
  {
    id: 'orbitron',
    name: 'Orbitron',
    family: "'Orbitron', sans-serif",
    category: 'digital',
    categoryLabel: 'Digital / Clock',
    googleFontName: 'Orbitron:wght@400;500;700;900',
    supportedWeights: [400, 500, 700, 900],
    supportsItalic: false,
  },
  {
    id: 'share-tech-mono',
    name: 'Share Tech Mono',
    family: "'Share Tech Mono', monospace",
    category: 'digital',
    categoryLabel: 'Digital / Clock',
    googleFontName: 'Share+Tech+Mono',
    supportedWeights: [400],
    supportsItalic: false,
  },
  {
    id: 'vt323',
    name: 'VT323 (LCD Segment)',
    family: "'VT323', monospace",
    category: 'digital',
    categoryLabel: 'Digital / Clock',
    googleFontName: 'VT323',
    supportedWeights: [400],
    supportsItalic: false,
  },
  {
    id: 'silkscreen',
    name: 'Silkscreen 8-Bit',
    family: "'Silkscreen', monospace",
    category: 'digital',
    categoryLabel: 'Digital / Clock',
    googleFontName: 'Silkscreen:wght@400;700',
    supportedWeights: [400, 700],
    supportsItalic: false,
  },

  // MONOSPACE / TECHNICAL
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'JetBrains+Mono:ital,wght@0,300;0,400;0,700;0,800;1,400',
    supportedWeights: [300, 400, 700, 800],
    supportsItalic: true,
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    family: "'Fira Code', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Fira+Code:wght@300;400;600;700',
    supportedWeights: [300, 400, 600, 700],
    supportsItalic: false,
  },
  {
    id: 'fira-mono',
    name: 'Fira Mono',
    family: "'Fira Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Fira+Mono:wght@400;700',
    supportedWeights: [400, 700],
    supportsItalic: false,
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    family: "'IBM Plex Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'IBM+Plex+Mono:ital,wght@0,300;0,400;0,600;0,700;1,400',
    supportedWeights: [300, 400, 600, 700],
    supportsItalic: true,
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    family: "'Source Code Pro', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Source+Code+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400',
    supportedWeights: [300, 400, 600, 700],
    supportsItalic: true,
  },
  {
    id: 'ubuntu-mono',
    name: 'Ubuntu Mono',
    family: "'Ubuntu Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Ubuntu+Mono:ital,wght@0,400;0,700;1,400',
    supportedWeights: [400, 700],
    supportsItalic: true,
  },
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    family: "'Roboto Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Roboto+Mono:ital,wght@0,300;0,400;0,600;0,700;1,400',
    supportedWeights: [300, 400, 600, 700],
    supportsItalic: true,
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    family: "'Space Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Space+Mono:ital,wght@0,400;0,700;1,400',
    supportedWeights: [400, 700],
    supportsItalic: true,
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    family: "'Inconsolata', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Inconsolata:wght@300;400;700;900',
    supportedWeights: [300, 400, 700, 900],
    supportsItalic: false,
  },
  {
    id: 'noto-sans-mono',
    name: 'Noto Sans Mono',
    family: "'Noto Sans Mono', monospace",
    category: 'monospace',
    categoryLabel: 'Monospace',
    googleFontName: 'Noto+Sans+Mono:wght@300;400;600;700',
    supportedWeights: [300, 400, 600, 700],
    supportsItalic: false,
  },

  // MODERN / UI
  {
    id: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Inter:wght@300;400;600;800',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: true,
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400',
    supportedWeights: [300, 400, 500, 700],
    supportsItalic: true,
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Open+Sans:ital,wght@0,300;0,400;0,600;0,800;1,400',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: true,
  },
  {
    id: 'noto-sans',
    name: 'Noto Sans',
    family: "'Noto Sans', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Noto+Sans:ital,wght@0,300;0,400;0,600;0,800;1,400',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: true,
  },
  {
    id: 'manrope',
    name: 'Manrope',
    family: "'Manrope', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Manrope:wght@300;400;600;800',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: false,
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Montserrat:ital,wght@0,300;0,400;0,600;0,800;0,900;1,400',
    supportedWeights: [300, 400, 600, 800, 900],
    supportsItalic: true,
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Poppins:ital,wght@0,300;0,400;0,600;0,800;1,400',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: true,
  },
  {
    id: 'nunito-sans',
    name: 'Nunito Sans',
    family: "'Nunito Sans', sans-serif",
    category: 'modern',
    categoryLabel: 'Modern UI',
    googleFontName: 'Nunito+Sans:ital,wght@0,300;0,400;0,600;0,800;1,400',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: true,
  },

  // FUTURISTIC / DISPLAY
  {
    id: 'exo-2',
    name: 'Exo 2',
    family: "'Exo 2', sans-serif",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Exo+2:ital,wght@0,300;0,400;0,600;0,800;0,900;1,400',
    supportedWeights: [300, 400, 600, 800, 900],
    supportsItalic: true,
  },
  {
    id: 'rajdhani',
    name: 'Rajdhani',
    family: "'Rajdhani', sans-serif",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Rajdhani:wght@400;500;600;700',
    supportedWeights: [400, 500, 600, 700],
    supportsItalic: false,
  },
  {
    id: 'audiowide',
    name: 'Audiowide',
    family: "'Audiowide', cursive",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Audiowide',
    supportedWeights: [400],
    supportsItalic: false,
  },
  {
    id: 'michroma',
    name: 'Michroma',
    family: "'Michroma', sans-serif",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Michroma',
    supportedWeights: [400],
    supportsItalic: false,
  },
  {
    id: 'oxanium',
    name: 'Oxanium',
    family: "'Oxanium', cursive",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Oxanium:wght@300;400;600;800',
    supportedWeights: [300, 400, 600, 800],
    supportsItalic: false,
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Space+Grotesk:wght@400;600;700',
    supportedWeights: [400, 600, 700],
    supportsItalic: false,
  },
  {
    id: 'share-tech',
    name: 'Share Tech',
    family: "'Share Tech', sans-serif",
    category: 'futuristic',
    categoryLabel: 'Futuristic',
    googleFontName: 'Share+Tech',
    supportedWeights: [400],
    supportsItalic: false,
  },

  // SERIF / ELEGANT
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'serif',
    categoryLabel: 'Serif / Elegant',
    googleFontName: 'Playfair+Display:ital,wght@0,400;0,600;0,800;0,900;1,400',
    supportedWeights: [400, 600, 800, 900],
    supportsItalic: true,
  },
  {
    id: 'cormorant-garamond',
    name: 'Cormorant Garamond',
    family: "'Cormorant Garamond', serif",
    category: 'serif',
    categoryLabel: 'Serif / Elegant',
    googleFontName: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400',
    supportedWeights: [400, 600, 700],
    supportsItalic: true,
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: "'Merriweather', serif",
    category: 'serif',
    categoryLabel: 'Serif / Elegant',
    googleFontName: 'Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400',
    supportedWeights: [300, 400, 700, 900],
    supportsItalic: true,
  },
  {
    id: 'libre-baskerville',
    name: 'Libre Baskerville',
    family: "'Libre Baskerville', serif",
    category: 'serif',
    categoryLabel: 'Serif / Elegant',
    googleFontName: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
    supportedWeights: [400, 700],
    supportsItalic: true,
  },
];

const loadedFontsSet = new Set<string>();

/**
 * Lazy load a web font into document head
 */
export function loadFont(font: FontMeta) {
  if (!font || loadedFontsSet.has(font.id) || !font.googleFontName) return;

  try {
    const linkId = `font-link-${font.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontName}&display=swap`;
      document.head.appendChild(link);
    }
    loadedFontsSet.add(font.id);
  } catch (e) {
    console.warn(`Failed to inject Google Font link for ${font.name}:`, e);
  }
}

/**
 * Register a user-uploaded custom font file (.woff, .woff2, .ttf, .otf)
 */
export async function loadCustomFontFile(file: File): Promise<FontMeta | null> {
  if (!file || typeof window === 'undefined' || !('FontFace' in window)) return null;

  try {
    const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\s-]/g, '');
    const familyName = `CustomFont_${fontName}_${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();

    const fontFace = new FontFace(familyName, arrayBuffer);
    await fontFace.load();
    document.fonts.add(fontFace);

    const customFont: FontMeta = {
      id: `custom-${Date.now()}`,
      name: `${fontName} (Custom)`,
      family: `'${familyName}', sans-serif`,
      category: 'custom',
      categoryLabel: 'Custom Font',
      supportedWeights: [400, 700],
      supportsItalic: false,
      isCustom: true,
    };

    loadedFontsSet.add(customFont.id);
    return customFont;
  } catch (err) {
    console.warn('Error loading custom font file:', err);
    return null;
  }
}
