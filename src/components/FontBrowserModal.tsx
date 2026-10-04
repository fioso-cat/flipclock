import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Star,
  Clock,
  Upload,
  Type,
  Sliders,
  Check,
  Sparkles,
  History,
} from 'lucide-react';
import { ClockSettings } from '../types';
import {
  FONT_LIBRARY,
  FontMeta,
  FontCategory,
  loadFont,
  loadCustomFontFile,
} from '../utils/fonts';

interface FontBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  clockSettings: ClockSettings;
  updateClockSettings: (updater: (prev: ClockSettings) => ClockSettings) => void;
}

export const FontBrowserModal: React.FC<FontBrowserModalProps> = ({
  isOpen,
  onClose,
  clockSettings,
  updateClockSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FontCategory>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [previewText, setPreviewText] = useState<string>('01:37:42');
  const [customFonts, setCustomFonts] = useState<FontMeta[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Combine built-in library with custom uploaded fonts
  const allFonts = useMemo(() => {
    return [...FONT_LIBRARY, ...customFonts];
  }, [customFonts]);

  // Ensure current selected font is loaded
  const currentFontMeta = useMemo(() => {
    return (
      allFonts.find((f) => f.id === clockSettings.fontFamily) || FONT_LIBRARY[0]
    );
  }, [allFonts, clockSettings.fontFamily]);

  useEffect(() => {
    if (currentFontMeta) {
      loadFont(currentFontMeta);
    }
  }, [currentFontMeta]);

  // Lazy load fonts as modal opens or renders
  useEffect(() => {
    if (isOpen) {
      allFonts.forEach((f) => loadFont(f));
    }
  }, [isOpen, allFonts]);

  if (!isOpen) return null;

  // Filtered fonts list
  const filteredFonts = allFonts.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || f.category === selectedCategory;

    const matchesFavorites =
      !showOnlyFavorites || clockSettings.favorites.includes(f.id);

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Handle Favorite Star Toggle
  const toggleFavorite = (fontId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateClockSettings((prev) => {
      const isFav = prev.favorites.includes(fontId);
      const newFavs = isFav
        ? prev.favorites.filter((id) => id !== fontId)
        : [...prev.favorites, fontId];
      return { ...prev, favorites: newFavs };
    });
  };

  // Select Font Action
  const handleSelectFont = (font: FontMeta) => {
    loadFont(font);
    updateClockSettings((prev) => {
      const newRecent = [font.id, ...prev.recentFonts.filter((id) => id !== font.id)].slice(
        0,
        8
      );
      // Default to 400 or first available weight if current weight not supported
      const safeWeight = font.supportedWeights.includes(prev.fontWeight)
        ? prev.fontWeight
        : font.supportedWeights[0] || 400;

      return {
        ...prev,
        fontFamily: font.id,
        fontWeight: safeWeight,
        recentFonts: newRecent,
      };
    });
  };

  // Custom Font Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const customFont = await loadCustomFontFile(file);
      if (customFont) {
        setCustomFonts((prev) => [...prev, customFont]);
        handleSelectFont(customFont);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Clock Typography Library
              </h2>
              <p className="text-xs text-slate-400">
                Browse, preview, and apply curated clock & digital fonts with zero layout shift
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".woff,.woff2,.ttf,.otf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-xl text-xs border border-slate-700 transition-colors shadow"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Font</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Control Bar: Search, Category Filters, Live Preview Input */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search fonts by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Live Preview Text Input */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs text-slate-400 whitespace-nowrap">Preview Text:</span>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-36 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-center font-mono text-cyan-300 outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                onClick={() => {
                  const now = new Date();
                  setPreviewText(
                    now.toLocaleTimeString(undefined, { hour12: false })
                  );
                }}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center space-x-1"
                title="Set to live time"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Now</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pt-1">
            {[
              { id: 'all', label: 'All Fonts' },
              { id: 'digital', label: 'Digital / LCD' },
              { id: 'monospace', label: 'Monospace' },
              { id: 'modern', label: 'Modern UI' },
              { id: 'futuristic', label: 'Futuristic' },
              { id: 'serif', label: 'Serif' },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id && !showOnlyFavorites;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id as FontCategory);
                    setShowOnlyFavorites(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            <button
              onClick={() => setShowOnlyFavorites((prev) => !prev)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                showOnlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Favorites ({clockSettings.favorites.length})</span>
            </button>
          </div>
        </div>

        {/* Selected Font Customizer Strip (Weight / Style) */}
        {currentFontMeta && (
          <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Selected:</span>
              <span
                className="text-base text-cyan-300 font-bold"
                style={{ fontFamily: currentFontMeta.family }}
              >
                {currentFontMeta.name}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Weight Selector */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Weight:</span>
                <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {currentFontMeta.supportedWeights.map((w) => (
                    <button
                      key={w}
                      onClick={() =>
                        updateClockSettings((prev) => ({
                          ...prev,
                          fontWeight: w,
                        }))
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                        clockSettings.fontWeight === w
                          ? 'bg-cyan-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Italic Toggle */}
              {currentFontMeta.supportsItalic && (
                <button
                  onClick={() =>
                    updateClockSettings((prev) => ({
                      ...prev,
                      fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic',
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg font-semibold italic border transition-all ${
                    clockSettings.fontStyle === 'italic'
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Italic
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Grid Browser Container - FIXED CARD DIMENSIONS & CLS = 0 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFonts.map((font) => {
              const isSelected = clockSettings.fontFamily === font.id;
              const isFav = clockSettings.favorites.includes(font.id);

              return (
                <div
                  key={font.id}
                  onClick={() => handleSelectFont(font)}
                  className={`relative h-[120px] p-3.5 rounded-2xl cursor-pointer transition-all box-sizing-border flex flex-col justify-between overflow-hidden group select-none ${
                    isSelected
                      ? 'bg-cyan-950/40 border border-cyan-500/80 shadow-[inset_0_0_0_2px_rgba(6,182,212,0.8)]'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800'
                  }`}
                  style={{ boxSizing: 'border-box' }}
                >
                  {/* Top Header Row in Card */}
                  <div className="flex items-center justify-between pointer-events-none">
                    <span
                      className="text-sm font-semibold truncate text-white"
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </span>

                    <div className="flex items-center space-x-1.5 pointer-events-auto">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 uppercase tracking-wider">
                        {font.category}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(font.id, e)}
                        className="p-1 hover:scale-110 transition-transform"
                        title={isFav ? 'Remove Favorite' : 'Add Favorite'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isFav
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Fixed Height Live Preview Box - GUARANTEES CLS = 0 */}
                  <div className="h-[48px] w-full flex items-center justify-center overflow-hidden my-1">
                    <span
                      className="whitespace-nowrap truncate tracking-wider text-center text-cyan-200 transition-colors"
                      style={{
                        fontFamily: font.family,
                        fontSize: '1.4rem',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {previewText || '01:37:42'}
                    </span>
                  </div>

                  {/* Card Footer Info */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pointer-events-none border-t border-slate-800/50 pt-1">
                    <span>Weights: {font.supportedWeights.join(', ')}</span>
                    {isSelected && (
                      <span className="flex items-center text-cyan-400 font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3 mr-1" /> Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFonts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Type className="w-10 h-10 text-slate-600" />
              <p className="text-sm">No fonts matching your search or category filter.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Active Font: <strong className="text-white">{currentFontMeta.name}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
