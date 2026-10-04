import { RenderContext, VisualizerPresetId } from '../types';
import { rgba, interpolatePalette } from '../utils/color-palettes';

// Internal state persistence for animated particle/starfield systems across frames
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  angle?: number;
  radius?: number;
  speed?: number;
  char?: string;
}

const particleCache: Record<string, Particle[]> = {};

function getCachedParticles(key: string, count: number, initFn: () => Particle): Particle[] {
  if (!particleCache[key] || particleCache[key].length !== count) {
    particleCache[key] = Array.from({ length: count }, initFn);
  }
  return particleCache[key];
}

function safeArc(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2,
  counterclockwise?: boolean
) {
  const safeR = Math.max(0, radius);
  c.arc(x, y, safeR, startAngle, endAngle, counterclockwise);
}

function safeRadialGradient(
  c: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
) {
  const safeR0 = Math.max(0, r0);
  const safeR1 = Math.max(0, r1);
  return c.createRadialGradient(x0, y0, safeR0, x1, y1, safeR1);
}
function getCenterCoords(ctx: RenderContext): { cx: number; cy: number } {
  const { width, height, vSettings } = ctx;
  let cx = width / 2;
  let cy = height / 2;

  switch (vSettings.position) {
    case 'top':
      cy = height * 0.25;
      break;
    case 'bottom':
      cy = height * 0.75;
      break;
    case 'left':
      cx = width * 0.25;
      break;
    case 'right':
      cx = width * 0.75;
      break;
    case 'custom':
      cx = (vSettings.customX / 100) * width;
      cy = (vSettings.customY / 100) * height;
      break;
    case 'center':
    default:
      cx = width / 2;
      cy = height / 2;
      break;
  }
  return { cx, cy };
}

// ----------------------------------------------------
// 1. OCEAN PRESET
// ----------------------------------------------------
function renderOcean(ctx: RenderContext) {
  const { ctx: c, width, height, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const scale = vSettings.scale;
  const intensity = vSettings.intensity;

  // Layered audio reactive ocean waves
  const waveCount = pSettings.quality === 'low' ? 3 : 5;
  const baseFreq = 0.005 / scale;

  for (let w = 0; w < waveCount; w++) {
    c.beginPath();
    const waveY = cy + (w - waveCount / 2) * 35;
    const waveSpeed = time * (0.8 + w * 0.3) * vSettings.speed;
    const waveColor = palette.gradientStops[w % palette.gradientStops.length] || palette.primary;

    c.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const distFromCenter = 1 - Math.abs(x - cx) / (width * 0.5);
      const bassAmp = audio.bass * 80 * intensity * Math.max(0.2, distFromCenter);
      const midAmp = audio.mid * 30 * intensity;

      const y =
        waveY +
        Math.sin(x * baseFreq + waveSpeed + w) * (20 + bassAmp) +
        Math.cos(x * baseFreq * 2.5 - waveSpeed) * (10 + midAmp);

      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }

    c.lineTo(width, height);
    c.lineTo(0, height);
    c.closePath();

    c.fillStyle = rgba(waveColor, 0.25 + w * 0.15);
    c.fill();
  }

  // Sparkles / Treble ripples
  if (pSettings.quality !== 'low') {
    const particleCount = Math.floor(30 * pSettings.particleDensity);
    const sparkles = getCachedParticles('ocean_sparkles', particleCount, () => ({
      x: Math.random() * width,
      y: cy + (Math.random() - 0.5) * 150,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.8,
      size: Math.random() * 3 + 1,
      color: palette.accent,
      alpha: Math.random(),
      life: Math.random() * 100,
      maxLife: 100,
    }));

    sparkles.forEach((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 1;
      if (s.life <= 0 || s.y < cy - 100) {
        s.x = Math.random() * width;
        s.y = cy + 80;
        s.life = 100;
      }

      const drawSize = s.size * (1 + audio.treble * 2);
      c.fillStyle = rgba(palette.accent, 0.4 + audio.treble * 0.6);
      c.beginPath();
      safeArc(c, s.x, s.y, drawSize);
      c.fill();
    });
  }
}

// ----------------------------------------------------
// 2. SUNSHINE PRESET
// ----------------------------------------------------
function renderSunshine(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const baseRadius = 80 * vSettings.scale + audio.bass * 100 * vSettings.intensity;
  const rayCount = pSettings.quality === 'low' ? 24 : 48;

  // Central Sun Corona
  const grad = safeRadialGradient(c, cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 2.5);
  grad.addColorStop(0, palette.accent);
  grad.addColorStop(0.4, palette.primary);
  grad.addColorStop(1, 'transparent');

  c.fillStyle = grad;
  c.beginPath();
  safeArc(c, cx, cy, baseRadius * 2.5);
  c.fill();

  // Radial Sunshine Rays
  c.save();
  c.translate(cx, cy);
  c.rotate(time * 0.2 * vSettings.speed);

  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const binIndex = Math.floor((i / rayCount) * (audio.rawFrequencyData.length / 2));
    const freqVal = audio.rawFrequencyData[binIndex] / 255 || 0;
    const rayLength = baseRadius + freqVal * 160 * vSettings.intensity;

    c.strokeStyle = rgba(palette.gradientStops[i % palette.gradientStops.length], 0.6 + freqVal * 0.4);
    c.lineWidth = (Math.PI * 2 * baseRadius) / rayCount / 2;
    c.lineCap = 'round';

    c.beginPath();
    c.moveTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
    c.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
    c.stroke();
  }
  c.restore();
}

// ----------------------------------------------------
// 3. GALAXY PRESET
// ----------------------------------------------------
function renderGalaxy(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const starCount = Math.floor((pSettings.quality === 'low' ? 120 : 300) * pSettings.particleDensity);

  const stars = getCachedParticles('galaxy_stars', starCount, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 1.5) * 450;
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius,
      angle,
      size: Math.random() * 2.5 + 0.5,
      color: palette.gradientStops[Math.floor(Math.random() * palette.gradientStops.length)],
      alpha: Math.random() * 0.8 + 0.2,
      life: 0,
      maxLife: 100,
      speed: (0.002 + Math.random() * 0.005) * (1 / (radius + 20)),
    };
  });

  c.save();
  c.translate(cx, cy);

  const rotSpeed = time * 0.1 * vSettings.speed;

  stars.forEach((s) => {
    s.angle! += (s.speed! + audio.overallEnergy * 0.01 * vSettings.intensity) * vSettings.speed;
    const r = s.radius! * (1 + audio.bass * 0.4 * vSettings.intensity);
    const x = Math.cos(s.angle! + rotSpeed) * r;
    const y = Math.sin(s.angle! + rotSpeed) * r;

    c.fillStyle = rgba(s.color, s.alpha * (0.6 + audio.treble * 0.4));
    c.beginPath();
    safeArc(c, x, y, s.size * (1 + audio.treble * 1.5));
    c.fill();
  });

  // Galaxy Central Black Hole / Bright Vortex
  const coreRadius = (40 + audio.bass * 60 * vSettings.intensity) * vSettings.scale;
  const coreGrad = safeRadialGradient(c, 0, 0, 0, 0, 0, coreRadius * 2);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, palette.accent);
  coreGrad.addColorStop(0.7, palette.primary);
  coreGrad.addColorStop(1, 'transparent');

  c.fillStyle = coreGrad;
  c.beginPath();
  safeArc(c, 0, 0, coreRadius * 2);
  c.fill();

  c.restore();
}

// ----------------------------------------------------
// 4. AURORA PRESET
// ----------------------------------------------------
function renderAurora(ctx: RenderContext) {
  const { ctx: c, width, time, audio, palette, vSettings, pSettings } = ctx;
  const { cy } = getCenterCoords(ctx);
  const curtainCount = pSettings.quality === 'low' ? 3 : 5;

  for (let i = 0; i < curtainCount; i++) {
    c.beginPath();
    const offsetY = cy + (i - curtainCount / 2) * 50;
    const speed = time * (0.3 + i * 0.15) * vSettings.speed;

    c.moveTo(0, offsetY);
    for (let x = 0; x <= width; x += 15) {
      const sin1 = Math.sin(x * 0.003 + speed + i) * 60;
      const sin2 = Math.cos(x * 0.007 - speed * 0.5) * 40;
      const audioBump = audio.bass * 70 * vSettings.intensity * Math.sin((x / width) * Math.PI);

      c.lineTo(x, offsetY + sin1 + sin2 - audioBump);
    }
    c.lineTo(width, offsetY + 200);
    c.lineTo(0, offsetY + 200);
    c.closePath();

    const color = palette.gradientStops[i % palette.gradientStops.length];
    const grad = c.createLinearGradient(0, offsetY - 50, 0, offsetY + 200);
    grad.addColorStop(0, rgba(color, 0.7));
    grad.addColorStop(0.5, rgba(palette.accent, 0.3));
    grad.addColorStop(1, 'transparent');

    c.fillStyle = grad;
    c.fill();
  }
}

// ----------------------------------------------------
// 5. NEON PRESET
// ----------------------------------------------------
function renderNeon(ctx: RenderContext) {
  const { ctx: c, width, height, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);

  // Synthwave perspective grid
  const lineCount = pSettings.quality === 'low' ? 16 : 32;
  const horizonY = cy;

  c.strokeStyle = rgba(palette.primary, 0.4 + audio.bass * 0.4);
  c.lineWidth = 1.5;

  // Perspective vertical lines
  for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
    const xTop = cx + i * 10 * vSettings.scale;
    const xBottom = cx + i * (width / lineCount) * 2 * vSettings.scale;

    c.beginPath();
    c.moveTo(xTop, horizonY);
    c.lineTo(xBottom, height);
    c.stroke();
  }

  // Moving horizontal grid lines
  const gridOffset = (time * 60 * vSettings.speed) % 40;
  for (let y = horizonY; y <= height; y += (y - horizonY + 10) * 0.15) {
    const drawY = y + gridOffset * ((y - horizonY) / (height - horizonY));
    if (drawY > height) continue;

    c.beginPath();
    c.moveTo(0, drawY);
    c.lineTo(width, drawY);
    c.stroke();
  }

  // Neon Spectrum Pillars on Horizon
  const barCount = 24;
  const barWidth = (width * 0.8) / barCount;
  const startX = cx - (barCount * barWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const val = audio.rawFrequencyData[i * 2] / 255 || 0;
    const barHeight = val * 120 * vSettings.intensity;
    const x = startX + i * barWidth;

    c.fillStyle = rgba(palette.gradientStops[i % palette.gradientStops.length], 0.8);
    c.fillRect(x, horizonY - barHeight, barWidth - 4, barHeight);
  }
}

// ----------------------------------------------------
// 6. COSMIC PRESET
// ----------------------------------------------------
function renderCosmic(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const particleCount = Math.floor((pSettings.quality === 'low' ? 80 : 200) * pSettings.particleDensity);

  const particles = getCachedParticles('cosmic_dust', particleCount, () => ({
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 800,
    vx: (Math.random() - 0.5) * 1,
    vy: (Math.random() - 0.5) * 1,
    size: Math.random() * 3 + 1,
    color: palette.gradientStops[Math.floor(Math.random() * palette.gradientStops.length)],
    alpha: Math.random(),
    life: Math.random() * 100,
    maxLife: 100,
  }));

  c.save();
  c.translate(cx, cy);

  particles.forEach((p) => {
    p.x += p.vx * (1 + audio.overallEnergy * 3 * vSettings.speed);
    p.y += p.vy * (1 + audio.overallEnergy * 3 * vSettings.speed);

    if (Math.abs(p.x) > 500 || Math.abs(p.y) > 500) {
      p.x = (Math.random() - 0.5) * 50;
      p.y = (Math.random() - 0.5) * 50;
    }

    const dist = Math.sqrt(p.x * p.x + p.y * p.y);
    const size = p.size * (1 + audio.bass * 2);

    c.fillStyle = rgba(p.color, Math.max(0.1, 1 - dist / 500));
    c.beginPath();
    safeArc(c, p.x, p.y, size);
    c.fill();
  });

  // Radial Energy Waves
  const ringCount = 3;
  for (let r = 0; r < ringCount; r++) {
    const ringRadius = Math.max(0, ((time * 100 * vSettings.speed + r * 120) % 350) * (1 + audio.bass * 0.3));
    c.strokeStyle = rgba(palette.accent, Math.max(0, 1 - ringRadius / 350));
    c.lineWidth = 2;
    c.beginPath();
    safeArc(c, 0, 0, ringRadius);
    c.stroke();
  }

  c.restore();
}

// ----------------------------------------------------
// 7. FIRE PRESET
// ----------------------------------------------------
function renderFire(ctx: RenderContext) {
  const { ctx: c, width, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const emberCount = Math.floor((pSettings.quality === 'low' ? 60 : 150) * pSettings.particleDensity);

  const embers = getCachedParticles('fire_embers', emberCount, () => ({
    x: cx + (Math.random() - 0.5) * 300,
    y: cy + 100 + Math.random() * 100,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -Math.random() * 3 - 1,
    size: Math.random() * 4 + 2,
    color: palette.gradientStops[Math.floor(Math.random() * palette.gradientStops.length)],
    alpha: 1,
    life: Math.random() * 80,
    maxLife: 80,
  }));

  // Rising embers
  embers.forEach((e) => {
    e.x += e.vx + Math.sin(time * 3 + e.y * 0.02) * 1.5;
    e.y += e.vy * (1 + audio.bass * 2 * vSettings.intensity);
    e.life -= 1;

    if (e.life <= 0 || e.y < cy - 250) {
      e.x = cx + (Math.random() - 0.5) * (200 + audio.bass * 200);
      e.y = cy + 120;
      e.life = 80;
    }

    const lifeRatio = Math.max(0, e.life / e.maxLife);
    c.fillStyle = rgba(e.color, lifeRatio);
    c.beginPath();
    safeArc(c, e.x, e.y, e.size * lifeRatio * (1 + audio.treble * 1.5));
    c.fill();
  });

  // Flame Base Wave
  c.beginPath();
  c.moveTo(cx - 200, cy + 120);
  for (let x = cx - 200; x <= cx + 200; x += 10) {
    const dist = 1 - Math.abs(x - cx) / 200;
    const flameHeight = Math.sin(x * 0.05 + time * 8) * 30 * dist + audio.bass * 120 * dist * vSettings.intensity;
    c.lineTo(x, cy + 120 - flameHeight);
  }
  c.lineTo(cx + 200, cy + 120);
  c.closePath();

  const flameGrad = c.createLinearGradient(0, cy + 120, 0, cy - 50);
  flameGrad.addColorStop(0, palette.gradientStops[0] || '#ff0000');
  flameGrad.addColorStop(0.5, palette.gradientStops[1] || '#ffaa00');
  flameGrad.addColorStop(1, 'transparent');

  c.fillStyle = flameGrad;
  c.fill();
}

// ----------------------------------------------------
// 8. MATRIX PRESET
// ----------------------------------------------------
function renderMatrix(ctx: RenderContext) {
  const { ctx: c, width, height, audio, palette, vSettings, pSettings } = ctx;
  const colCount = pSettings.quality === 'low' ? 20 : 45;
  const colWidth = width / colCount;

  const glyphs = '0123456789ABCDEF$#@%&*+-~<>[]';

  const drops = getCachedParticles('matrix_drops', colCount, () => ({
    x: 0,
    y: Math.random() * height,
    vx: 0,
    vy: Math.random() * 5 + 3,
    size: colWidth * 0.8,
    color: palette.accent,
    alpha: 1,
    life: 0,
    maxLife: 100,
    char: glyphs[Math.floor(Math.random() * glyphs.length)],
  }));

  c.font = `${Math.floor(colWidth * 0.85)}px monospace`;

  drops.forEach((d, i) => {
    d.x = i * colWidth + colWidth * 0.1;
    d.y += d.vy * (1 + audio.overallEnergy * 3 * vSettings.speed);

    if (d.y > height) {
      d.y = -20;
      d.char = glyphs[Math.floor(Math.random() * glyphs.length)];
    }

    const binVal = audio.rawFrequencyData[i % audio.rawFrequencyData.length] / 255 || 0;
    c.fillStyle = binVal > 0.6 ? '#ffffff' : palette.primary;
    c.fillText(d.char || '0', d.x, d.y);
  });
}

// ----------------------------------------------------
// 9. PARTICLE PRESET
// ----------------------------------------------------
function renderParticle(ctx: RenderContext) {
  const { ctx: c, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const count = Math.floor((pSettings.quality === 'low' ? 50 : 120) * pSettings.particleDensity);

  const swarm = getCachedParticles('swarm_particles', count, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 200 + 50;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 2,
      color: palette.gradientStops[Math.floor(Math.random() * palette.gradientStops.length)],
      alpha: Math.random() * 0.8 + 0.2,
      life: 0,
      maxLife: 100,
    };
  });

  swarm.forEach((p, i) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Audio force push
    const force = audio.bass * 8 * vSettings.intensity;
    p.x += (dx / (dist + 1)) * force + p.vx;
    p.y += (dy / (dist + 1)) * force + p.vy;

    // Boundary check
    if (dist > 400) {
      p.x = cx + (Math.random() - 0.5) * 100;
      p.y = cy + (Math.random() - 0.5) * 100;
    }

    // Draw particle
    c.fillStyle = rgba(p.color, p.alpha);
    c.beginPath();
    safeArc(c, p.x, p.y, p.size * (1 + audio.treble));
    c.fill();

    // Connect nearby particles if quality is high
    if (pSettings.quality === 'high' && i % 3 === 0) {
      for (let j = i + 1; j < swarm.length; j += 4) {
        const p2 = swarm[j];
        const d2 = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (d2 < 70) {
          c.strokeStyle = rgba(palette.accent, (1 - d2 / 70) * 0.3);
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p2.x, p2.y);
          c.stroke();
        }
      }
    }
  });
}

// ----------------------------------------------------
// 10. RADIAL PRESET
// ----------------------------------------------------
function renderRadial(ctx: RenderContext) {
  const { ctx: c, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const baseRadius = 120 * vSettings.scale;
  const binCount = 64;

  c.save();
  c.translate(cx, cy);

  for (let i = 0; i < binCount; i++) {
    const angle = (i / binCount) * Math.PI * 2;
    const freq = audio.rawFrequencyData[i * 2] / 255 || 0;
    const barLen = freq * 140 * vSettings.intensity;

    const x1 = Math.cos(angle) * baseRadius;
    const y1 = Math.sin(angle) * baseRadius;
    const x2 = Math.cos(angle) * (baseRadius + barLen);
    const y2 = Math.sin(angle) * (baseRadius + barLen);

    c.strokeStyle = interpolatePalette(palette.gradientStops, i / binCount);
    c.lineWidth = (Math.PI * 2 * baseRadius) / binCount / 1.5;
    c.lineCap = 'round';

    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();

    if (vSettings.mirror) {
      c.beginPath();
      c.moveTo(-x1, -y1);
      c.lineTo(-x2, -y2);
      c.stroke();
    }
  }

  // Inner Pulsing Core
  c.fillStyle = rgba(palette.accent, 0.4 + audio.bass * 0.6);
  c.beginPath();
  safeArc(c, 0, 0, baseRadius * (0.8 + audio.bass * 0.3));
  c.fill();

  c.restore();
}

// ----------------------------------------------------
// 11. WAVE PRESET
// ----------------------------------------------------
function renderWave(ctx: RenderContext) {
  const { ctx: c, width, time, audio, palette, vSettings } = ctx;
  const { cy } = getCenterCoords(ctx);
  const data = audio.rawTimeDomainData;
  const sliceWidth = width / data.length;

  const waveLayers = vSettings.mirror ? 2 : 1;

  for (let l = 0; l < waveLayers; l++) {
    c.beginPath();
    c.lineWidth = 3 * vSettings.scale;
    c.strokeStyle = l === 0 ? palette.accent : palette.secondary;

    let x = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = cy + (v - 1) * 150 * vSettings.intensity * (l === 1 ? -1 : 1);

      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);

      x += sliceWidth;
    }
    c.stroke();
  }
}

// ----------------------------------------------------
// 12. SPECTRUM PRESET
// ----------------------------------------------------
function renderSpectrum(ctx: RenderContext) {
  const { ctx: c, width, height, audio, palette, vSettings, pSettings } = ctx;
  const { cy } = getCenterCoords(ctx);
  const barCount = pSettings.quality === 'low' ? 32 : 64;
  const totalWidth = width * 0.8 * vSettings.scale;
  const barWidth = totalWidth / barCount;
  const gap = 3;
  const startX = (width - totalWidth) / 2;

  const peakCaps = getCachedParticles('spectrum_caps', barCount, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 0,
    color: palette.accent,
    alpha: 1,
    life: 0,
    maxLife: 0,
  }));

  for (let i = 0; i < barCount; i++) {
    const binIndex = Math.floor((i / barCount) * (audio.rawFrequencyData.length / 2));
    const val = audio.rawFrequencyData[binIndex] / 255 || 0;
    const barHeight = val * (height * 0.4) * vSettings.intensity;
    const x = startX + i * barWidth;
    const y = cy - barHeight / 2;

    // Draw Bar
    const color = interpolatePalette(palette.gradientStops, i / barCount);
    c.fillStyle = color;
    c.fillRect(x + gap / 2, y, barWidth - gap, barHeight);

    // Peak Cap Decay
    const cap = peakCaps[i];
    if (-barHeight / 2 < cap.y) {
      cap.y = -barHeight / 2;
    } else {
      cap.y += 2; // decay downwards
    }

    c.fillStyle = palette.accent;
    c.fillRect(x + gap / 2, cy + cap.y - 3, barWidth - gap, 3);
  }
}

// ----------------------------------------------------
// 13. OSCILLOSCOPE PRESET
// ----------------------------------------------------
function renderOscilloscope(ctx: RenderContext) {
  const { ctx: c, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const data = audio.rawTimeDomainData;

  c.lineWidth = 2.5;
  c.strokeStyle = palette.accent;
  c.beginPath();

  const radius = 150 * vSettings.scale;

  for (let i = 0; i < data.length; i++) {
    const angle = (i / data.length) * Math.PI * 2;
    const amplitude = (data[i] / 128.0 - 1.0) * 80 * vSettings.intensity;
    const r = radius + amplitude;

    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
  c.stroke();
}

// ----------------------------------------------------
// 14. STARFIELD PRESET
// ----------------------------------------------------
function renderStarfield(ctx: RenderContext) {
  const { ctx: c, width, height, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const count = Math.floor((pSettings.quality === 'low' ? 100 : 250) * pSettings.particleDensity);

  const stars = getCachedParticles('starfield_3d', count, () => ({
    x: (Math.random() - 0.5) * width,
    y: (Math.random() - 0.5) * height,
    vx: 0,
    vy: 0,
    size: Math.random() * 2 + 1,
    color: palette.gradientStops[Math.floor(Math.random() * palette.gradientStops.length)],
    alpha: 1,
    life: 0,
    maxLife: 1000,
  }));

  const speedMultiplier = (2 + audio.bass * 15 * vSettings.intensity) * vSettings.speed;

  stars.forEach((s) => {
    s.x += (s.x / 100) * speedMultiplier;
    s.y += (s.y / 100) * speedMultiplier;

    if (Math.abs(s.x) > width / 2 || Math.abs(s.y) > height / 2) {
      s.x = (Math.random() - 0.5) * 50;
      s.y = (Math.random() - 0.5) * 50;
    }

    c.fillStyle = s.color;
    c.beginPath();
    safeArc(c, cx + s.x, cy + s.y, s.size * (1 + audio.treble));
    c.fill();
  });
}

// ----------------------------------------------------
// 15. FLUID PRESET
// ----------------------------------------------------
function renderFluid(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const blobCount = 5;

  for (let i = 0; i < blobCount; i++) {
    const angle = time * 0.5 * vSettings.speed + (i * Math.PI * 2) / blobCount;
    const r = 80 * vSettings.scale + Math.sin(time * 2 + i) * 30 + audio.bass * 50;
    const bx = cx + Math.cos(angle) * r;
    const by = cy + Math.sin(angle) * r;

    const fluidRadius = 100 * vSettings.scale;
    const grad = safeRadialGradient(c, bx, by, 10, bx, by, fluidRadius);
    grad.addColorStop(0, palette.gradientStops[i % palette.gradientStops.length]);
    grad.addColorStop(1, 'transparent');

    c.fillStyle = grad;
    c.beginPath();
    safeArc(c, bx, by, fluidRadius);
    c.fill();
  }
}

// ----------------------------------------------------
// 16. VORTEX PRESET
// ----------------------------------------------------
function renderVortex(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const arms = 4;
  const pointsPerArm = 40;

  c.save();
  c.translate(cx, cy);

  for (let a = 0; a < arms; a++) {
    c.beginPath();
    c.strokeStyle = palette.gradientStops[a % palette.gradientStops.length];
    c.lineWidth = 3;

    for (let p = 0; p < pointsPerArm; p++) {
      const dist = p * 8 * vSettings.scale;
      const angle = (a * Math.PI * 2) / arms + p * 0.15 - time * 1.5 * vSettings.speed;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      if (p === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }

  c.restore();
}

// ----------------------------------------------------
// 17. RAIN PRESET
// ----------------------------------------------------
function renderRain(ctx: RenderContext) {
  const { ctx: c, width, height, audio, palette, vSettings, pSettings } = ctx;
  const count = Math.floor((pSettings.quality === 'low' ? 40 : 100) * pSettings.particleDensity);

  const drops = getCachedParticles('neon_rain', count, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: Math.random() * 8 + 4,
    size: Math.random() * 15 + 10,
    color: palette.gradientStops[Math.floor(Math.random() * palette.gradientStops.length)],
    alpha: Math.random() * 0.7 + 0.3,
    life: 0,
    maxLife: 100,
  }));

  drops.forEach((d) => {
    d.y += d.vy * (1 + audio.overallEnergy * 2 * vSettings.speed);
    if (d.y > height) {
      d.y = -20;
      d.x = Math.random() * width;
    }

    c.strokeStyle = rgba(d.color, d.alpha);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(d.x, d.y);
    c.lineTo(d.x, d.y + d.size * (1 + audio.treble * 2));
    c.stroke();
  });
}

// ----------------------------------------------------
// 18. PLASMA PRESET
// ----------------------------------------------------
function renderPlasma(ctx: RenderContext) {
  const { ctx: c, width, height, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);

  const ringCount = 6;
  for (let r = 0; r < ringCount; r++) {
    const rad = (r + 1) * 35 * vSettings.scale + audio.bass * 40 * vSettings.intensity;
    c.strokeStyle = palette.gradientStops[r % palette.gradientStops.length];
    c.lineWidth = 4;

    c.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += 0.1) {
      const warp = Math.sin(a * 5 + time * 3 + r) * 15 * audio.mid;
      const x = cx + Math.cos(a) * (rad + warp);
      const y = cy + Math.sin(a) * (rad + warp);

      if (a === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    c.stroke();
  }
}

// ----------------------------------------------------
// 19. DIGITAL PRESET
// ----------------------------------------------------
function renderDigital(ctx: RenderContext) {
  const { ctx: c, width, height, audio, palette, vSettings } = ctx;
  const { cy } = getCenterCoords(ctx);
  const rows = 12;
  const cols = 24;
  const gridW = width * 0.7 * vSettings.scale;
  const cellW = gridW / cols;
  const cellH = 15;
  const startX = (width - gridW) / 2;

  for (let col = 0; col < cols; col++) {
    const freqIndex = Math.floor((col / cols) * (audio.rawFrequencyData.length / 2));
    const level = Math.floor((audio.rawFrequencyData[freqIndex] / 255) * rows);

    for (let row = 0; row < rows; row++) {
      const x = startX + col * cellW;
      const y = cy + (rows / 2 - row) * (cellH + 3);

      const isActive = row <= level;
      c.fillStyle = isActive ? palette.accent : rgba(palette.primary, 0.15);
      c.fillRect(x + 2, y, cellW - 4, cellH);
    }
  }
}

// ----------------------------------------------------
// 20. MINIMAL PRESET
// ----------------------------------------------------
function renderMinimal(ctx: RenderContext) {
  const { ctx: c, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);

  const radius = (100 + audio.bass * 50 * vSettings.intensity) * vSettings.scale;

  // Single Minimal Ring
  c.strokeStyle = palette.accent;
  c.lineWidth = 2;
  c.beginPath();
  safeArc(c, cx, cy, radius);
  c.stroke();

  // Subtle Inner Point
  c.fillStyle = palette.primary;
  c.beginPath();
  safeArc(c, cx, cy, 6 * (1 + audio.treble));
  c.fill();
}

// ----------------------------------------------------
// MAIN VISUALIZER ENGINE ROUTER
// ----------------------------------------------------
export function renderVisualizer(ctx: RenderContext) {
  const { preset } = ctx.vSettings;

  switch (preset) {
    case 'ocean':
      renderOcean(ctx);
      break;
    case 'sunshine':
      renderSunshine(ctx);
      break;
    case 'galaxy':
      renderGalaxy(ctx);
      break;
    case 'aurora':
      renderAurora(ctx);
      break;
    case 'neon':
      renderNeon(ctx);
      break;
    case 'cosmic':
      renderCosmic(ctx);
      break;
    case 'fire':
      renderFire(ctx);
      break;
    case 'matrix':
      renderMatrix(ctx);
      break;
    case 'particle':
      renderParticle(ctx);
      break;
    case 'radial':
      renderRadial(ctx);
      break;
    case 'wave':
      renderWave(ctx);
      break;
    case 'spectrum':
      renderSpectrum(ctx);
      break;
    case 'oscilloscope':
      renderOscilloscope(ctx);
      break;
    case 'starfield':
      renderStarfield(ctx);
      break;
    case 'fluid':
      renderFluid(ctx);
      break;
    case 'vortex':
      renderVortex(ctx);
      break;
    case 'rain':
      renderRain(ctx);
      break;
    case 'plasma':
      renderPlasma(ctx);
      break;
    case 'digital':
      renderDigital(ctx);
      break;
    case 'minimal':
    default:
      renderMinimal(ctx);
      break;
  }
}
