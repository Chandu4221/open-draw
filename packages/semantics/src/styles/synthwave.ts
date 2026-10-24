import type { StyleTokens } from './types.js';

export const synthwaveStyle: StyleTokens = Object.freeze({
  id: 'synthwave',
  label: 'Synthwave Outrun',
  description: 'Retro 80s neon purple, hot pink, sunset orange, and CRT scanline dark horizon vibe',
  notes: 'Retro-futuristic outrun aesthetic with neon glow on deep magenta and purple midnight surfaces.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#1a0b2e',
    surface: '#26123d',
    border: '#ff2a85',
    primary: '#ff7300',
    text: '#ffffff',
    mutedText: '#b388ff',
  }),
  borders: Object.freeze({
    width: 1.5,
    radius: 8,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 4,
    blur: 16,
    color: 'rgba(255, 42, 133, 0.35)',
  }),
  typography: Object.freeze({
    headingFont: "'Audiowide', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 15,
  }),
});
