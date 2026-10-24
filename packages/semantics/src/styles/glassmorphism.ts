import type { StyleTokens } from './types.js';

/**
 * Glassmorphism design style token profile.
 * Translucent surfaces, backdrop blur, 12-20px radii, soft ambient shadows, thin specular borders.
 * Pure data — zero rendering code, zero canvas knowledge.
 */
export const glassmorphismStyle: StyleTokens = Object.freeze({
  id: 'glassmorphism',
  label: 'Glassmorphism',
  description: 'Translucent surfaces, backdrop blur, soft ambient shadows, thin specular borders',
  notes: 'Translucent surfaces with backdrop blur; maps to Web backdrop-filter, Android RenderEffect, Flutter BackdropFilter.',
  platforms: Object.freeze(['web', 'flutter', 'android'] as const),
  palette: Object.freeze({
    background: '#0f172a',
    surface: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.25)',
    primary: '#38bdf8',
    text: '#ffffff',
    mutedText: 'rgba(255, 255, 255, 0.70)',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 16,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 8,
    blur: 32,
    color: 'rgba(0, 0, 0, 0.20)',
  }),
  typography: Object.freeze({
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 16,
  }),
});
