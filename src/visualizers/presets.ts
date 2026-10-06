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
// PLANET 1: JUPITER (Gas Giant & Red Spot Storm)
// ----------------------------------------------------
function renderJupiter(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const planetRadius = 140 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Planet Atmosphere Glow
  const atmosGrad = safeRadialGradient(c, 0, 0, planetRadius * 0.8, 0, 0, planetRadius * 1.3);
  atmosGrad.addColorStop(0, rgba(palette.accent, 0.4));
  atmosGrad.addColorStop(1, 'transparent');
  c.fillStyle = atmosGrad;
  c.beginPath();
  safeArc(c, 0, 0, planetRadius * 1.3);
  c.fill();

  // Clip to Planet Sphere
  c.beginPath();
  safeArc(c, 0, 0, planetRadius);
  c.clip();

  // Base Gas Gradient
  const baseGrad = c.createLinearGradient(0, -planetRadius, 0, planetRadius);
  baseGrad.addColorStop(0, palette.gradientStops[0] || '#2b1b17');
  baseGrad.addColorStop(0.5, palette.gradientStops[1] || '#c87d55');
  baseGrad.addColorStop(1, palette.gradientStops[2] || '#4a2c20');
  c.fillStyle = baseGrad;
  c.fillRect(-planetRadius, -planetRadius, planetRadius * 2, planetRadius * 2);

  // Swirling Gas Bands
  const bandCount = 12;
  const bandHeight = (planetRadius * 2) / bandCount;
  for (let i = 0; i < bandCount; i++) {
    const y = -planetRadius + i * bandHeight;
    const isLightBand = i % 2 === 0;
    c.fillStyle = isLightBand ? rgba('#ffe3cd', 0.25) : rgba('#8d4f38', 0.35);

    c.beginPath();
    c.moveTo(-planetRadius, y);
    for (let x = -planetRadius; x <= planetRadius; x += 10) {
      const wave = Math.sin(x * 0.03 + time * 1.2 + i) * (6 + audio.bass * 15 * vSettings.intensity);
      c.lineTo(x, y + wave);
    }
    c.lineTo(planetRadius, y + bandHeight);
    c.lineTo(-planetRadius, y + bandHeight);
    c.closePath();
    c.fill();
  }

  // Great Red Spot Vortex
  const spotX = Math.cos(time * 0.3) * (planetRadius * 0.3);
  const spotY = planetRadius * 0.35;
  const spotRadius = (35 + audio.bass * 20 * vSettings.intensity) * vSettings.scale;

  const spotGrad = safeRadialGradient(c, spotX, spotY, 5, spotX, spotY, spotRadius);
  spotGrad.addColorStop(0, '#e63946');
  spotGrad.addColorStop(0.6, '#9b2226');
  spotGrad.addColorStop(1, 'transparent');
  c.fillStyle = spotGrad;
  c.beginPath();
  safeArc(c, spotX, spotY, spotRadius);
  c.fill();

  // Auroral Polar Lights
  c.strokeStyle = rgba(palette.accent, 0.6 + audio.treble * 0.4);
  c.lineWidth = 4;
  c.beginPath();
  safeArc(c, 0, -planetRadius * 0.85, planetRadius * 0.3);
  c.stroke();

  c.restore();
}

// ----------------------------------------------------
// PLANET 2: SATURN (Golden Ringed World)
// ----------------------------------------------------
function renderSaturn(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const planetRadius = 85 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Saturn Planet Body
  const planetGrad = safeRadialGradient(c, -20, -20, 10, 0, 0, planetRadius);
  planetGrad.addColorStop(0, '#fefae0');
  planetGrad.addColorStop(0.5, '#dda15e');
  planetGrad.addColorStop(1, '#bc6c25');
  c.fillStyle = planetGrad;
  c.beginPath();
  safeArc(c, 0, 0, planetRadius);
  c.fill();

  // Tilted 3D Concentric Ring System
  const ringAngles = 0.35;
  c.rotate(ringAngles);

  const ringCount = 8;
  for (let r = 0; r < ringCount; r++) {
    const rx = (planetRadius * 1.5 + r * 14 * vSettings.scale) * (1 + audio.mid * 0.15);
    const ry = rx * 0.3;
    const color = palette.gradientStops[r % palette.gradientStops.length] || palette.accent;

    c.strokeStyle = rgba(color, 0.5 + (r / ringCount) * 0.4);
    c.lineWidth = 3 + (r % 3);

    c.beginPath();
    c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    c.stroke();
  }

  // Ring Particles Dancing
  const count = 30;
  for (let p = 0; p < count; p++) {
    const pAngle = time * 0.8 + (p * Math.PI * 2) / count;
    const pDist = planetRadius * 1.8 + (p % 5) * 12;
    const px = Math.cos(pAngle) * pDist;
    const py = Math.sin(pAngle) * pDist * 0.3;

    c.fillStyle = palette.accent;
    c.beginPath();
    safeArc(c, px, py, 2.5 * (1 + audio.treble * 1.5));
    c.fill();
  }

  c.restore();
}

// ----------------------------------------------------
// PLANET 3: NEPTUNE (Supersonic Ice Giant)
// ----------------------------------------------------
function renderNeptune(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const planetRadius = 120 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Outer Supersonic Shockwaves
  const waveCount = 3;
  for (let w = 0; w < waveCount; w++) {
    const shockR = (planetRadius + (time * 60 + w * 70) % 180) * (1 + audio.bass * 0.4);
    c.strokeStyle = rgba('#00b4d8', Math.max(0, 1 - shockR / 300));
    c.lineWidth = 2;
    c.beginPath();
    safeArc(c, 0, 0, shockR);
    c.stroke();
  }

  // Planet Globe
  const neptuneGrad = safeRadialGradient(c, -30, -30, 10, 0, 0, planetRadius);
  neptuneGrad.addColorStop(0, '#90e0ef');
  neptuneGrad.addColorStop(0.4, '#0077b6');
  neptuneGrad.addColorStop(1, '#03045e');
  c.fillStyle = neptuneGrad;
  c.beginPath();
  safeArc(c, 0, 0, planetRadius);
  c.fill();

  // Swirling Methane Cloud Wisps
  c.strokeStyle = rgba('#ffffff', 0.6 + audio.mid * 0.4);
  c.lineWidth = 3;
  for (let m = 0; m < 5; m++) {
    c.beginPath();
    const my = -planetRadius * 0.6 + m * 40;
    c.moveTo(-planetRadius * 0.8, my);
    for (let x = -planetRadius * 0.8; x <= planetRadius * 0.8; x += 15) {
      const wisp = Math.cos(x * 0.04 + time * 3 + m) * 12 * audio.mid;
      c.lineTo(x, my + wisp);
    }
    c.stroke();
  }

  c.restore();
}

// ----------------------------------------------------
// PLANET 4: SUPERNOVA (Cosmic Star Explosion)
// ----------------------------------------------------
function renderSupernova(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const coreRadius = (40 + audio.bass * 80 * vSettings.intensity) * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Exploding Core
  const coreGrad = safeRadialGradient(c, 0, 0, 0, 0, 0, coreRadius * 2);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, palette.accent);
  coreGrad.addColorStop(0.7, palette.primary);
  coreGrad.addColorStop(1, 'transparent');
  c.fillStyle = coreGrad;
  c.beginPath();
  safeArc(c, 0, 0, coreRadius * 2);
  c.fill();

  // Expanding Shockwave Rings
  const ringCount = 4;
  for (let r = 0; r < ringCount; r++) {
    const ringR = ((time * 120 * vSettings.speed + r * 100) % 400) * (1 + audio.bass * 0.5);
    c.strokeStyle = rgba(palette.gradientStops[r % palette.gradientStops.length], 1 - ringR / 400);
    c.lineWidth = 4;
    c.beginPath();
    safeArc(c, 0, 0, ringR);
    c.stroke();
  }

  // Radial Ray Ejecta
  const rays = pSettings.quality === 'low' ? 24 : 48;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const freqVal = audio.rawFrequencyData[i * 2] / 255 || 0;
    const rayLen = coreRadius + freqVal * 180 * vSettings.intensity;

    c.strokeStyle = rgba(palette.gradientStops[i % palette.gradientStops.length], 0.7);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(Math.cos(angle) * coreRadius, Math.sin(angle) * coreRadius);
    c.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
    c.stroke();
  }

  c.restore();
}

// ----------------------------------------------------
// PLANET 5: SOLAR ECLIPSE (Blinding Corona)
// ----------------------------------------------------
function renderEclipse(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const moonRadius = 110 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Solar Corona Radiance
  const coronaR = moonRadius * (1.2 + audio.bass * 0.8 * vSettings.intensity);
  const coronaGrad = safeRadialGradient(c, 0, 0, moonRadius * 0.9, 0, 0, coronaR);
  coronaGrad.addColorStop(0, '#ffffff');
  coronaGrad.addColorStop(0.3, palette.accent);
  coronaGrad.addColorStop(0.7, palette.primary);
  coronaGrad.addColorStop(1, 'transparent');
  c.fillStyle = coronaGrad;
  c.beginPath();
  safeArc(c, 0, 0, coronaR);
  c.fill();

  // Solar Prominences Arching Out
  const prominenceCount = pSettings.quality === 'low' ? 16 : 36;
  for (let i = 0; i < prominenceCount; i++) {
    const angle = (i / prominenceCount) * Math.PI * 2 + time * 0.1;
    const freqVal = audio.rawFrequencyData[i * 2] / 255 || 0;
    const flareLen = moonRadius + freqVal * 120 * vSettings.intensity;

    c.strokeStyle = rgba('#ffb703', 0.8);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(Math.cos(angle) * moonRadius, Math.sin(angle) * moonRadius);
    c.lineTo(Math.cos(angle) * flareLen, Math.sin(angle) * flareLen);
    c.stroke();
  }

  // Dark Moon Silhouette
  c.fillStyle = '#050508';
  c.beginPath();
  safeArc(c, 0, 0, moonRadius);
  c.fill();

  c.restore();
}

// ----------------------------------------------------
// PLANET 6: BLACK HOLE (Event Horizon, Lensing & Relativistic Jets)
// ----------------------------------------------------
function renderBlackHole(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const holeRadius = 75 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // 1. Relativistic Polar Jets blasting vertically on audio peak
  const jetPower = audio.bass * 1.2 * vSettings.intensity;
  if (jetPower > 0.2) {
    const jetLen = (200 + jetPower * 250) * vSettings.scale;
    const jetGrad = safeRadialGradient(c, 0, 0, 5, 0, 0, jetLen);
    jetGrad.addColorStop(0, '#ffffff');
    jetGrad.addColorStop(0.3, palette.accent || '#48cae4');
    jetGrad.addColorStop(0.7, palette.primary || '#7209b7');
    jetGrad.addColorStop(1, 'transparent');

    c.fillStyle = jetGrad;
    c.beginPath();
    // North Jet
    c.moveTo(-10, 0);
    c.lineTo(-30 * jetPower, -jetLen);
    c.lineTo(30 * jetPower, -jetLen);
    c.lineTo(10, 0);
    // South Jet
    c.lineTo(10, 0);
    c.lineTo(30 * jetPower, jetLen);
    c.lineTo(-30 * jetPower, jetLen);
    c.lineTo(-10, 0);
    c.fill();
  }

  // 2. Gravitational Lensing Outer Halo
  const haloR = holeRadius * (2.2 + audio.bass * 0.8 * vSettings.intensity);
  const haloGrad = safeRadialGradient(c, 0, 0, holeRadius, 0, 0, haloR);
  haloGrad.addColorStop(0, rgba('#ffffff', 0.9));
  haloGrad.addColorStop(0.3, rgba(palette.accent || '#ff70a6', 0.6));
  haloGrad.addColorStop(0.7, rgba(palette.primary || '#7000ff', 0.3));
  haloGrad.addColorStop(1, 'transparent');

  c.fillStyle = haloGrad;
  c.beginPath();
  safeArc(c, 0, 0, haloR);
  c.fill();

  // 3. Swirling Accretion Disk (3D Elliptical perspective)
  c.rotate(time * 0.6 * vSettings.speed);
  const diskR = holeRadius * (2.0 + audio.mid * 0.8 * vSettings.intensity);
  const diskGrad = safeRadialGradient(c, 0, 0, holeRadius, 0, 0, diskR);
  diskGrad.addColorStop(0, '#ffffff');
  diskGrad.addColorStop(0.3, palette.accent || '#ff9770');
  diskGrad.addColorStop(0.7, palette.secondary || '#7000ff');
  diskGrad.addColorStop(1, 'transparent');

  c.fillStyle = diskGrad;
  c.beginPath();
  c.ellipse(0, 0, diskR, diskR * 0.32, 0, 0, Math.PI * 2);
  c.fill();

  // Swirling Particle Dust in Accretion Disk
  if (pSettings.quality !== 'low') {
    const dustCount = 36;
    for (let d = 0; d < dustCount; d++) {
      const dAngle = (d / dustCount) * Math.PI * 2 + time * 1.2;
      const dDist = holeRadius * 1.1 + (d % 6) * 18 * (1 + audio.mid * 0.5);
      const dx = Math.cos(dAngle) * dDist;
      const dy = Math.sin(dAngle) * (dDist * 0.32);
      c.fillStyle = d % 2 === 0 ? '#ffffff' : palette.accent || '#70e000';
      c.beginPath();
      safeArc(c, dx, dy, 2.5 * (1 + audio.treble * 0.8));
      c.fill();
    }
  }

  // 4. Photon Ring (Blinding White Boundary)
  c.strokeStyle = rgba('#ffffff', 0.95);
  c.lineWidth = 3.5;
  c.beginPath();
  safeArc(c, 0, 0, holeRadius * 1.08);
  c.stroke();

  // 5. Pitch Black Event Horizon (Singularity Void)
  c.fillStyle = '#000000';
  c.beginPath();
  safeArc(c, 0, 0, holeRadius);
  c.fill();

  c.restore();
}

// ----------------------------------------------------
// PLANET 7: PULSAR (Spinning Gamma Beams)
// ----------------------------------------------------
function renderPulsar(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const starRadius = (35 + audio.bass * 30 * vSettings.intensity) * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Dual Gamma Radiation Beams
  const spinAngle = time * 3.5 * vSettings.speed;
  c.rotate(spinAngle);

  const beamLength = 450 * vSettings.scale;
  const beamWidth = (15 + audio.treble * 35) * vSettings.intensity;

  c.fillStyle = rgba(palette.accent, 0.7);
  c.beginPath();
  c.moveTo(-beamWidth / 2, 0);
  c.lineTo(-beamWidth * 2, -beamLength);
  c.lineTo(beamWidth * 2, -beamLength);
  c.lineTo(beamWidth / 2, 0);
  c.fill();

  c.beginPath();
  c.moveTo(-beamWidth / 2, 0);
  c.lineTo(-beamWidth * 2, beamLength);
  c.lineTo(beamWidth * 2, beamLength);
  c.lineTo(beamWidth / 2, 0);
  c.fill();

  // Pulsar Star Core
  c.fillStyle = '#ffffff';
  c.beginPath();
  safeArc(c, 0, 0, starRadius);
  c.fill();

  c.restore();
}

// ----------------------------------------------------
// PLANET 8: EXOPLANET (Bioluminescent Alien World)
// ----------------------------------------------------
function renderExoplanet(ctx: RenderContext) {
  const { ctx: c, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const planetRadius = 115 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Atmospheric Rim Glow
  const rimGrad = safeRadialGradient(c, 0, 0, planetRadius * 0.9, 0, 0, planetRadius * 1.25);
  rimGrad.addColorStop(0, rgba('#00f5d4', 0.5 + audio.bass * 0.4));
  rimGrad.addColorStop(1, 'transparent');
  c.fillStyle = rimGrad;
  c.beginPath();
  safeArc(c, 0, 0, planetRadius * 1.25);
  c.fill();

  // Alien Planet Body
  const exoGrad = safeRadialGradient(c, -30, -30, 10, 0, 0, planetRadius);
  exoGrad.addColorStop(0, '#7b2cbf');
  exoGrad.addColorStop(0.6, '#3a0ca3');
  exoGrad.addColorStop(1, '#03071e');
  c.fillStyle = exoGrad;
  c.beginPath();
  safeArc(c, 0, 0, planetRadius);
  c.fill();

  // Bioluminescent Continent Contours
  c.strokeStyle = rgba('#70e000', 0.7 + audio.mid * 0.3);
  c.lineWidth = 2.5;
  for (let b = 0; b < 4; b++) {
    const angle = b * 1.5 + time * 0.2;
    const bx = Math.cos(angle) * (planetRadius * 0.4);
    const by = Math.sin(angle) * (planetRadius * 0.4);
    c.beginPath();
    safeArc(c, bx, by, 25 * (1 + audio.mid * 0.8));
    c.stroke();
  }

  c.restore();
}

// Pre-allocated persistent Float32Array for Synthwave 3D terrain vertices
// Max 50 rows x 50 cols, each vertex holds 4 floats: [px, py, scale, hRatio]
const MAX_SYNTH_ROWS = 20;
const MAX_SYNTH_COLS = 50;
const synthwaveVertexBuffer = new Float32Array(MAX_SYNTH_ROWS * MAX_SYNTH_COLS * 4);

// Persistent Ring Buffer for Frozen Terrain Row Snapshots
let frozenTerrainBuffer: Float32Array[] = [];
let accumulatedScrollZ = 0;
let snapshotStepCount = 0;
let smoothSunScaleMultiplier = 1.0;
function createFrozenHorizonRow(
  cols: number,
  audio: AudioAnalysis,
  vSettings: VisualizerSettings,
  stepIdx: number
): Float32Array {
  const rowY = new Float32Array(cols + 1);
  const rawData = audio.rawFrequencyData;

  // ✅ 12 note positions (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
  const NOTE_COUNT = 24;

  for (let cIdx = 0; cIdx <= cols; cIdx++) {
    const valleyDist = Math.abs(cIdx - cols / 2) / (cols / 2);
    const mountainFactor = Math.pow(valleyDist, 1.4);

    // Ridge noise — núi nền
    const ridge1 = 1 - Math.abs(Math.sin(cIdx * 0.9));
    const ridge2 = 1 - Math.abs(Math.sin(cIdx * 1.7 + 1.3));
    const ridge3 = 1 - Math.abs(Math.sin(cIdx * 3.1 + 2.7));
    const ridgeCombined = ridge1 * 25 + ridge2 * 15 + ridge3 * 8;
    const flankStaticHeight = mountainFactor * (15 + ridgeCombined);

    // ✅ MAP cIdx → note index (0..11)
    // Mỗi note chiếm 1 vùng trên terrain
    const noteProgress = cIdx / cols;  // 0..1
    const noteIdx = Math.floor(noteProgress * NOTE_COUNT) % NOTE_COUNT;

    // ✅ MAP note index → FFT bin
    // Note C (0) → bin thấp, note B (11) → bin cao
    // Giả sử FFT có 512 bin, note range từ bin 2 → bin 200 (tùy chỉnh)
    const binLow = 2;
    const binHigh = Math.floor(rawData.length * 0.4);  // 40% đầu là note range
    const binIdx = binLow + Math.floor((noteIdx / NOTE_COUNT) * (binHigh - binLow));

    // ✅ Lấy energy của note đó
    const freqVal = (rawData[binIdx] || 0) / 255;  // 0..1

    // ✅ Spike to theo note energy — không giới hạn
    const spikeHeight = freqVal * freqVal * 350 * vSettings.intensity;

    const centerGentle = Math.sin(cIdx * 0.7) * 3;

    const totalRawHeight = flankStaticHeight + spikeHeight + centerGentle;
    rowY[cIdx] = -totalRawHeight;
  }

  return rowY;
}

// ----------------------------------------------------
// SYNTHWAVE PRESET (Elevated Camera, Clamped Spikes, Static Sun)
// ----------------------------------------------------
function renderSynthwave(ctx: RenderContext) {
  const { ctx: c, width, height, audio, palette, vSettings, pSettings, deltaTime } = ctx;
  const { cx, cy } = getCenterCoords(ctx);

  // ✅ Sun horizon — cố định
  const sunHorizonY = Math.max(cy + height * 0.02, height * 0.55);

  // ✅ Camera up — terrain horizon CAO HƠN sun (âm = cao hơn)
  const cameraElevation = -10;
  const terrainHorizonY = sunHorizonY + cameraElevation;

  // ✅ Sun hoàn toàn tĩnh
  const baseSunR = Math.min(width, height) * 0.215 * vSettings.scale;
  const sunRadius = baseSunR;

  c.save();

  // 1. Sky Gradient — dùng sunHorizonY
  const skyGrad = c.createLinearGradient(0, 0, 0, sunHorizonY);
  skyGrad.addColorStop(0, '#05021a');
  skyGrad.addColorStop(0.5, '#190a38');
  skyGrad.addColorStop(1, '#3a0c5c');
  c.fillStyle = skyGrad;
  c.fillRect(0, 0, width, height);

  // 2. Sun Aura
  const auraPulse = 1.0 + audio.bass * 0.15 * Math.min(1.5, vSettings.intensity);
  const sunAuraRadius = sunRadius * 1.5 * auraPulse;
  const sunAuraGrad = safeRadialGradient(
    c, cx, sunHorizonY - sunRadius * 0.2, 5,
    cx, sunHorizonY - sunRadius * 0.2, sunAuraRadius
  );
  sunAuraGrad.addColorStop(0, rgba('#ff007f', 0.85));
  sunAuraGrad.addColorStop(0.4, rgba('#f72585', 0.55));
  sunAuraGrad.addColorStop(0.8, rgba('#7209b7', 0.25));
  sunAuraGrad.addColorStop(1, 'transparent');
  c.fillStyle = sunAuraGrad;
  c.beginPath();
  safeArc(c, cx, sunHorizonY - sunRadius * 0.2, sunAuraRadius);
  c.fill();

  // 3. Sun Disc — CLIP ĐÚNG BÁN NGUYỆT, không bị thừa
  c.save();
  c.beginPath();
  c.arc(cx, sunHorizonY, sunRadius, Math.PI, 0, false);  // ✅ arc đúng bán nguyệt
  c.closePath();  // ✅ đóng path — không lineTo xuống
  c.clip();

  const sunDiscGrad = c.createLinearGradient(0, sunHorizonY - baseSunR * 1.1, 0, sunHorizonY);
  sunDiscGrad.addColorStop(0, '#ffee32');
  sunDiscGrad.addColorStop(0.35, '#ff70a6');
  sunDiscGrad.addColorStop(0.75, '#f72585');
  sunDiscGrad.addColorStop(1, '#480ca8');
  c.fillStyle = sunDiscGrad;
  c.fillRect(cx - sunRadius * 1.2, sunHorizonY - sunRadius * 1.2, sunRadius * 2.4, sunRadius * 1.4);

  // Venetian Blind Cuts
  const sliceCount = 20;
  c.fillStyle = '#190a38';
  for (let s = 0; s < sliceCount; s++) {
    const progress = s / sliceCount;
    const sliceY = sunHorizonY - (1 - Math.pow(progress, 1.4)) * baseSunR * 0.95;
    const sliceHeight = (2.5 + progress * 8) * (1 + audio.mid * 0.15);
    c.fillRect(cx - sunRadius * 1.2, sliceY, sunRadius * 2.4, sliceHeight);
  }
  c.restore();

  // 4. Frozen Terrain Pipeline
  const cols = pSettings.quality === 'low' ? 18 : 28;
  const baseRows = pSettings.quality === 'low' ? 14 : 20;
  const extraPaddingRows = 12;
  const totalRows = Math.min(MAX_SYNTH_ROWS - 2, baseRows + extraPaddingRows);

  const colWidth = (width * 2.2) / cols;
  const rowDepth = 80;

  const dt = Math.min(0.1, deltaTime || 0.016);
  accumulatedScrollZ += dt * 90 * vSettings.speed;  // ✅ DƯƠNG

  // Init buffer
  if (
    frozenTerrainBuffer.length === 0 ||
    frozenTerrainBuffer[0]?.length !== cols + 1
  ) {
    frozenTerrainBuffer = [];
    for (let r = 0; r <= totalRows + 2; r++) {
      frozenTerrainBuffer.push(createFrozenHorizonRow(cols, audio, vSettings, r));
    }
  }

  // Shift buffer
  while (accumulatedScrollZ >= rowDepth) {  // ✅ >=
    accumulatedScrollZ -= rowDepth;          // ✅ -=
    snapshotStepCount++;

    const newHorizonSnapshot = createFrozenHorizonRow(cols, audio, vSettings, snapshotStepCount);
    frozenTerrainBuffer.unshift(newHorizonSnapshot);
    if (frozenTerrainBuffer.length > totalRows + 3) {
      frozenTerrainBuffer.pop();
    }
  }

  // Camera Setup
  const fov = 200;
  const cameraY = -180 + audio.bass * 5 * vSettings.intensity;
  const cameraZ = 25;

// Populate vertex buffer
for (let r = 0; r <= totalRows + 1; r++) {
  const z3d = (totalRows - r) * rowDepth - accumulatedScrollZ + 5;
  const frozenRow = frozenTerrainBuffer[r] || frozenTerrainBuffer[0];
  const rowOffset = r * MAX_SYNTH_COLS * 4;
  const worldRowSeed = snapshotStepCount - r;

  // ✅ nearCameraFactor — row càng gần camera, factor càng lớn
  const nearCameraFactor = Math.max(0, 1 - z3d / (rowDepth * 4));

  for (let cIdx = 0; cIdx <= cols; cIdx++) {
    const x3d = (cIdx - cols / 2) * colWidth;
    const y3d = frozenRow[cIdx] !== undefined ? frozenRow[cIdx] : 0;

    const scale = fov / Math.max(5, z3d + cameraZ);

    // Jitter
    const hash1 = Math.sin(worldRowSeed * 127.1 + cIdx * 311.7) * 43758.5453;
    const rand1 = hash1 - Math.floor(hash1);
    const hash2 = Math.sin(worldRowSeed * 269.5 + cIdx * 183.3) * 43758.5453;
    const rand2 = hash2 - Math.floor(hash2);

    const jitterX = (rand1 - 0.5) * 8 * scale;
    const jitterY = (rand2 - 0.5) * 12 * scale;

    const px = cx + x3d * scale + jitterX;

    // ✅ NÉN SPIKE GẦN CAMERA — không cho đâm vào camera
    // Row gần camera (nearCameraFactor cao) → y3d bị nén xuống
    const y3dAttenuated = y3d * (1 - nearCameraFactor * 0.85);

    let py = terrainHorizonY + (y3dAttenuated - cameraY) * scale + jitterY;

    // ✅ Clamp an toàn — không vượt sun
    if (py < sunHorizonY + 10) {
      py = sunHorizonY + 10;
    }

    const hRatio = Math.min(1, Math.abs(y3d) / 250);

    const vIdx = rowOffset + cIdx * 4;
    synthwaveVertexBuffer[vIdx] = px;
    synthwaveVertexBuffer[vIdx + 1] = py;
    synthwaveVertexBuffer[vIdx + 2] = scale;
    synthwaveVertexBuffer[vIdx + 3] = hRatio;
  }
}

  // Render wireframe
  for (let r = totalRows; r >= 0; r--) {
    const rowProgress = r / totalRows;
    const r0Offset = r * MAX_SYNTH_COLS * 4;
    const r1Offset = (r + 1) * MAX_SYNTH_COLS * 4;

    const depthFade = 1 - Math.pow(Math.max(0, rowProgress), 2.2);
    const audioBoost = (audio.mid * 0.3 + audio.bass * 0.2) * vSettings.intensity;

    // Fill
    c.fillStyle = palette.bgDark || '#000000';
    for (let cIdx = 0; cIdx < cols; cIdx++) {
      const idx00 = r0Offset + cIdx * 4;
      const idx10 = r0Offset + (cIdx + 1) * 4;
      const idx01 = r1Offset + cIdx * 4;
      const idx11 = r1Offset + (cIdx + 1) * 4;

      const p00_py = synthwaveVertexBuffer[idx00 + 1];
      const p10_py = synthwaveVertexBuffer[idx10 + 1];

      if (p00_py < sunHorizonY - 20 && p10_py < sunHorizonY - 20) continue;

      c.beginPath();
      c.moveTo(synthwaveVertexBuffer[idx00], synthwaveVertexBuffer[idx00 + 1]);
      c.lineTo(synthwaveVertexBuffer[idx10], synthwaveVertexBuffer[idx10 + 1]);
      c.lineTo(synthwaveVertexBuffer[idx11], synthwaveVertexBuffer[idx11 + 1]);
      c.lineTo(synthwaveVertexBuffer[idx01], synthwaveVertexBuffer[idx01 + 1]);
      c.closePath();
      c.fill();
    }

    // Stroke
    c.lineWidth = (0.6 + (1 - Math.max(0, rowProgress)) * 1.2) * (1 + audioBoost * 0.3);

    for (let cIdx = 0; cIdx < cols; cIdx++) {
      const idx00 = r0Offset + cIdx * 4;
      const idx10 = r0Offset + (cIdx + 1) * 4;
      const idx01 = r1Offset + cIdx * 4;
      const idx11 = r1Offset + (cIdx + 1) * 4;

      const p00_py = synthwaveVertexBuffer[idx00 + 1];
      const p10_py = synthwaveVertexBuffer[idx10 + 1];

      if (p00_py < sunHorizonY - 20 && p10_py < sunHorizonY - 20) continue;

      const h00 = synthwaveVertexBuffer[idx00 + 3];
      const h10 = synthwaveVertexBuffer[idx10 + 3];
      const h01 = synthwaveVertexBuffer[idx01 + 3];
      const h11 = synthwaveVertexBuffer[idx11 + 3];
      const peakH = Math.max(h00, h10, h01, h11);

      let wireColor;
      if (peakH > 0.6) {
        wireColor = rgba('#e0ffff', Math.min(1, depthFade * (0.95 + audioBoost)));
      } else if (peakH > 0.3) {
        wireColor = rgba('#4cc9f0', Math.min(1, depthFade * (0.75 + audioBoost)));
      } else {
        wireColor = rgba('#00b4d8', Math.min(1, depthFade * (0.55 + audioBoost)));
      }

      c.strokeStyle = wireColor;
      c.beginPath();
      c.moveTo(synthwaveVertexBuffer[idx00], synthwaveVertexBuffer[idx00 + 1]);
      c.lineTo(synthwaveVertexBuffer[idx10], synthwaveVertexBuffer[idx10 + 1]);
      c.lineTo(synthwaveVertexBuffer[idx11], synthwaveVertexBuffer[idx11 + 1]);
      c.lineTo(synthwaveVertexBuffer[idx01], synthwaveVertexBuffer[idx01 + 1]);
      c.closePath();
      c.stroke();
    }
  }

  c.restore();
}

// ----------------------------------------------------
// MARS PRESET
// ----------------------------------------------------
function renderMars(ctx: RenderContext) {
  const { ctx: c, width, height, time, audio, palette, vSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const marsRadius = Math.min(width, height) * 0.22 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Mars Atmosphere Glow
  const atmoGrad = safeRadialGradient(c, 0, 0, marsRadius * 0.9, 0, 0, marsRadius * 1.35);
  atmoGrad.addColorStop(0, rgba('#ff4d00', 0.6 + audio.bass * 0.4));
  atmoGrad.addColorStop(1, 'transparent');
  c.fillStyle = atmoGrad;
  c.beginPath();
  safeArc(c, 0, 0, marsRadius * 1.35);
  c.fill();

  // Mars Planet Body
  const planetGrad = safeRadialGradient(c, -marsRadius * 0.3, -marsRadius * 0.3, 10, 0, 0, marsRadius);
  planetGrad.addColorStop(0, '#e05638');
  planetGrad.addColorStop(0.6, '#b83214');
  planetGrad.addColorStop(1, '#5c1002');
  c.fillStyle = planetGrad;
  c.beginPath();
  safeArc(c, 0, 0, marsRadius);
  c.fill();

  // Craters & Valles Marineris Canyon
  c.strokeStyle = rgba('#3d0700', 0.6);
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(0, marsRadius * 0.1, marsRadius * 0.6, marsRadius * 0.15, -0.2, 0, Math.PI * 2);
  c.stroke();

  // Phobos & Deimos Moons orbiting
  const phobosDist = marsRadius * 1.6;
  const phobosAngle = time * 0.8 * vSettings.speed;
  const px = Math.cos(phobosAngle) * phobosDist;
  const py = Math.sin(phobosAngle) * (phobosDist * 0.4);

  c.fillStyle = '#d4a373';
  c.beginPath();
  safeArc(c, px, py, 7 * (1 + audio.treble * 0.5));
  c.fill();

  const deimosDist = marsRadius * 2.2;
  const deimosAngle = -time * 0.5 * vSettings.speed + 2;
  const dx = Math.cos(deimosAngle) * deimosDist;
  const dy = Math.sin(deimosAngle) * (deimosDist * 0.35);

  c.fillStyle = '#a3b18a';
  c.beginPath();
  safeArc(c, dx, dy, 5 * (1 + audio.mid * 0.5));
  c.fill();

  c.restore();
}

// ----------------------------------------------------
// SOLAR SYSTEM PRESET (13 Celestial Bodies Mapped to 13 Musical Frequency Notes)
// ----------------------------------------------------
function renderSolarSystem(ctx: RenderContext) {
  const { ctx: c, width, height, time, audio, vSettings, pSettings } = ctx;
  const { cx, cy } = getCenterCoords(ctx);
  const baseScale = Math.min(width, height) * 0.0022 * vSettings.scale;

  c.save();
  c.translate(cx, cy);

  // Central Sun (Pulsing to Master Sub-Bass Energy)
  const sunR = (26 + audio.bass * 35 * vSettings.intensity) * vSettings.scale;
  const sunGrad = safeRadialGradient(c, 0, 0, 2, 0, 0, sunR * 1.8);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.3, '#ffbe0b');
  sunGrad.addColorStop(0.65, '#fb5607');
  sunGrad.addColorStop(1, 'transparent');

  c.fillStyle = sunGrad;
  c.beginPath();
  safeArc(c, 0, 0, sunR * 1.8);
  c.fill();

  // 13 Celestial Bodies corresponding to 13 Musical Notes (C4 to C5)
  const noteBodies = [
    { note: 'C', name: 'Vulcan Core', dist: 45, size: 4, speed: 2.8, color: '#ff4d00', binIdx: 0 },
    { note: 'C#', name: 'Mercury', dist: 70, size: 5, speed: 2.3, color: '#ced4da', binIdx: 2 },
    { note: 'D', name: 'Venus', dist: 100, size: 7, speed: 1.8, color: '#f77f00', binIdx: 4 },
    { note: 'D#', name: 'Earth & Moon', dist: 135, size: 8, speed: 1.4, color: '#48cae4', binIdx: 6, hasMoon: true },
    { note: 'E', name: 'Mars', dist: 170, size: 6, speed: 1.1, color: '#e63946', binIdx: 8 },
    { note: 'F', name: 'Ceres Asteroid', dist: 205, size: 5, speed: 0.9, color: '#d4a373', binIdx: 10, isAsteroid: true },
    { note: 'F#', name: 'Jupiter', dist: 245, size: 15, speed: 0.7, color: '#f4a261', binIdx: 12, hasSpot: true },
    { note: 'G', name: 'Saturn', dist: 290, size: 12, speed: 0.5, color: '#e9c46a', binIdx: 14, hasRing: true },
    { note: 'G#', name: 'Uranus', dist: 335, size: 10, speed: 0.4, color: '#80ed99', binIdx: 16 },
    { note: 'A', name: 'Neptune', dist: 380, size: 10, speed: 0.3, color: '#4361ee', binIdx: 18 },
    { note: 'A#', name: 'Pluto & Charon', dist: 420, size: 5, speed: 0.22, color: '#a2d2ff', binIdx: 20 },
    { note: 'B', name: 'Eris', dist: 455, size: 5, speed: 0.16, color: '#f8f9fa', binIdx: 22 },
    { note: 'C5', name: 'Sedna Kuiper', dist: 490, size: 6, speed: 0.11, color: '#ff70a6', binIdx: 24 },
  ];

  const rawData = audio.rawFrequencyData;
  const maxBodies = pSettings.quality === 'low' ? 8 : noteBodies.length;

  for (let b = 0; b < maxBodies; b++) {
    const pl = noteBodies[b];
    const orbitR = pl.dist * baseScale * 170;

    // Extract frequency energy for this note's bin
    const freqBin = Math.min(rawData.length - 1, pl.binIdx * 3);
    const rawVal = rawData[freqBin] || 0;
    const noteEnergy = (rawVal / 255) * vSettings.intensity;

    // Orbit Ring with Audio-Reactive Note Glow
    const ringAlpha = 0.08 + noteEnergy * 0.6;
    c.strokeStyle = noteEnergy > 0.4 ? pl.color : rgba('#ffffff', ringAlpha);
    c.lineWidth = noteEnergy > 0.5 ? 2.5 : 1;
    c.beginPath();
    c.ellipse(0, 0, orbitR, orbitR * 0.45, 0, 0, Math.PI * 2);
    c.stroke();

    // Planet Position along orbit
    const angle = time * pl.speed * vSettings.speed * 0.5 + b * 0.48;
    const px = Math.cos(angle) * orbitR;
    const py = Math.sin(angle) * (orbitR * 0.45);

    // Audio Pulse Radial Wave when note triggers
    if (noteEnergy > 0.35) {
      const shockR = (pl.size * 2 + noteEnergy * 25) * vSettings.scale;
      c.strokeStyle = rgba(pl.color, 1 - noteEnergy * 0.8);
      c.lineWidth = 1.5;
      c.beginPath();
      safeArc(c, px, py, shockR);
      c.stroke();
    }

    // Saturn Ring
    if (pl.hasRing) {
      c.strokeStyle = rgba('#e9c46a', 0.8);
      c.lineWidth = 3.5;
      c.beginPath();
      c.ellipse(px, py, pl.size * 2.2, pl.size * 0.85, -0.25, 0, Math.PI * 2);
      c.stroke();
    }

    // Planet Body
    const planetR = pl.size * (1 + noteEnergy * 0.8) * vSettings.scale;
    const pGrad = safeRadialGradient(c, px - planetR * 0.3, py - planetR * 0.3, 1, px, py, planetR);
    pGrad.addColorStop(0, '#ffffff');
    pGrad.addColorStop(0.5, pl.color);
    pGrad.addColorStop(1, '#050508');

    c.fillStyle = pGrad;
    c.beginPath();
    safeArc(c, px, py, planetR);
    c.fill();

    // Earth's Moon
    if (pl.hasMoon) {
      const mAngle = time * 3.5;
      const mx = px + Math.cos(mAngle) * (planetR * 2.2);
      const my = py + Math.sin(mAngle) * (planetR * 1.1);
      c.fillStyle = '#e9ecef';
      c.beginPath();
      safeArc(c, mx, my, 2.5);
      c.fill();
    }

    // Note Tag Label (C, D#, A, etc.)
    if (pSettings.quality !== 'low') {
      c.fillStyle = rgba('#ffffff', 0.6 + noteEnergy * 0.4);
      c.font = '9px monospace';
      c.fillText(pl.note, px + planetR + 3, py + 3);
    }
  }

  c.restore();
}

// ----------------------------------------------------
// MAIN VISUALIZER ENGINE ROUTER
// ----------------------------------------------------
export function renderVisualizer(ctx: RenderContext) {
  const { preset } = ctx.vSettings;

  switch (preset) {
    case 'synthwave':
      renderSynthwave(ctx);
      break;
    case 'mars':
      renderMars(ctx);
      break;
    case 'solar_system':
      renderSolarSystem(ctx);
      break;
    case 'jupiter':
      renderJupiter(ctx);
      break;
    case 'saturn':
      renderSaturn(ctx);
      break;
    case 'neptune':
      renderNeptune(ctx);
      break;
    case 'supernova':
      renderSupernova(ctx);
      break;
    case 'eclipse':
      renderEclipse(ctx);
      break;
    case 'blackhole':
      renderBlackHole(ctx);
      break;
    case 'pulsar':
      renderPulsar(ctx);
      break;
    case 'exoplanet':
      renderExoplanet(ctx);
      break;
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
