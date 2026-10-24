import type { StyleTokens } from './types.js';

export const linearModernStyle: StyleTokens = Object.freeze({
  id: 'linear-modern',
  label: 'Linear Modern',
  description: 'Dark sleek tech aesthetic, ultra-fine borders, subtle ambient glow, high-density typography',
  notes: 'Sleek developer-first dark mode pioneered by Linear.app with subtle radial glows and slate hairlines.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#0b0d13',
    surface: '#12151f',
    border: '#262b3d',
    primary: '#5e6ad2',
    text: '#f7f8f8',
    mutedText: '#8a8f98',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 8,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 4,
    blur: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  }),
  typography: Object.freeze({
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 14,
  }),
});
