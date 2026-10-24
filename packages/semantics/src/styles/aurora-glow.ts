import type { StyleTokens } from './types.js';

export const auroraGlowStyle: StyleTokens = Object.freeze({
  id: 'aurora-glow',
  label: 'Aurora Glow',
  description: 'Deep cosmic dark surface with ambient multi-colored neon mesh gradient glows',
  notes: 'Dark mode aesthetic characterized by vibrant multi-color diffused ambient background glows.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#090a16',
    surface: '#13152c',
    border: '#2a2d54',
    primary: '#8b5cf6',
    text: '#f8fafc',
    mutedText: '#94a3b8',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 14,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 8,
    blur: 30,
    color: 'rgba(139, 92, 246, 0.25)',
  }),
  typography: Object.freeze({
    headingFont: "'Outfit', 'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 15,
  }),
});
