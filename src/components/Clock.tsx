import React, { useState, useEffect } from 'react';
import { ClockSettings } from '../types';
import { FONT_LIBRARY, loadFont } from '../utils/fonts';

interface ClockProps {
  settings: ClockSettings;
  colorGlow: string;
}

export const Clock: React.FC<ClockProps> = ({ settings, colorGlow }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    let animId: number;
    const update = () => {
      setTime(new Date());
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Lookup Font Meta and trigger font load if needed
  const fontMeta = FONT_LIBRARY.find((f) => f.id === settings.fontFamily);
  useEffect(() => {
    if (fontMeta) {
      loadFont(fontMeta);
    }
  }, [fontMeta]);

  const cssFontFamily = fontMeta ? fontMeta.family : "'Orbitron', sans-serif";

  // Format Time Strings
  const rawHours = time.getHours();
  const displayHours = settings.use24Hour
    ? rawHours.toString().padStart(2, '0')
    : (rawHours % 12 || 12).toString().padStart(2, '0');

  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const milliseconds = Math.floor(time.getMilliseconds() / 10)
    .toString()
    .padStart(2, '0');

  const amPm = !settings.use24Hour ? (rawHours >= 12 ? 'PM' : 'AM') : '';

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Position positioning style
  const getPositionStyle = () => {
    switch (settings.position) {
      case 'top':
        return { top: '15%', left: '50%', transform: 'translate(-50%, 0)' };
      case 'bottom':
        return { bottom: '15%', left: '50%', transform: 'translate(-50%, 0)' };
      case 'custom':
        return {
          left: `${settings.customX}%`,
          top: `${settings.customY}%`,
          transform: 'translate(-50%, -50%)',
        };
      case 'center':
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  // Glow style
  const textGlowStyle = settings.glow
    ? {
        textShadow: `0 0 ${20 * settings.glowIntensity}px ${colorGlow}, 0 0 ${
          40 * settings.glowIntensity
        }px ${colorGlow}`,
      }
    : {};

  // Individual Flip Card Digit Renderer with fixed width container to ensure zero layout shift
  const renderDigitCard = (char: string, key: string) => {
    if (!settings.flipStyle || char === ':') {
      return (
        <span
          key={key}
          className="inline-block text-center min-w-[0.5em] transition-all"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {char}
        </span>
      );
    }

    return (
      <div
        key={key}
        className="relative inline-flex items-center justify-center mx-[2px] px-2.5 py-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden group transition-all"
        style={{
          boxShadow: settings.glow
            ? `0 8px 32px 0 rgba(0,0,0,0.37), inset 0 0 12px ${colorGlow}`
            : '0 8px 32px 0 rgba(0,0,0,0.37)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {/* Subtle Horizontal Flip Crease Line */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/40 z-10 pointer-events-none" />
        <span className="relative z-0 leading-none min-w-[0.6em] text-center">{char}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed z-20 pointer-events-none select-none flex flex-col items-center justify-center transition-all duration-300"
      style={{
        ...getPositionStyle(),
        opacity: settings.opacity,
        fontFamily: cssFontFamily,
        fontWeight: settings.fontWeight || 700,
        fontStyle: settings.fontStyle || 'normal',
        filter: settings.blur > 0 ? `blur(${settings.blur}px)` : 'none',
      }}
    >
      {/* Time Display Container */}
      <div
        className="flex items-center justify-center text-white tracking-wider"
        style={{
          fontSize: `${settings.fontSize * 3.5}rem`,
          letterSpacing: `${settings.letterSpacing}px`,
          fontVariantNumeric: 'tabular-nums',
          ...textGlowStyle,
        }}
      >
        {/* Hours */}
        {displayHours.split('').map((char, i) => renderDigitCard(char, `h-${i}`))}

        {renderDigitCard(':', 'colon-1')}

        {/* Minutes */}
        {minutes.split('').map((char, i) => renderDigitCard(char, `m-${i}`))}

        {/* Seconds */}
        {settings.showSeconds && (
          <>
            {renderDigitCard(':', 'colon-2')}
            {seconds.split('').map((char, i) => renderDigitCard(char, `s-${i}`))}
          </>
        )}

        {/* Milliseconds */}
        {settings.showMilliseconds && (
          <span
            className="text-[0.45em] opacity-80 ml-2 font-mono"
            style={{
              fontSize: `${settings.fontSize * 1.5}rem`,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            .{milliseconds}
          </span>
        )}

        {/* AM / PM Badge */}
        {amPm && (
          <span className="text-[0.3em] font-semibold tracking-widest uppercase ml-3 self-baseline opacity-90 text-cyan-300">
            {amPm}
          </span>
        )}
      </div>

      {/* Date Display */}
      {settings.showDate && (
        <div
          className="mt-2 text-white/80 font-medium tracking-widest uppercase text-sm md:text-lg bg-black/20 backdrop-blur-sm px-4 py-1 rounded-full border border-white/10"
          style={textGlowStyle}
        >
          {dateString}
        </div>
      )}
    </div>
  );
};
