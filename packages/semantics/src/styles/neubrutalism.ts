import type { StyleTokens } from './types.js';

/**
 * Neubrutalism design style token profile per Phase 3 §4.
 * High-contrast borders, hard drop shadows, saturated primary accents, zero corner radii.
 * Pure data — zero rendering code, zero canvas knowledge.
 */
export const neubrutalismStyle: StyleTokens = Object.freeze({
  id: 'neubrutalism',
  label: 'Neubrutalism',
  description: 'High-contrast black borders, hard drop shadows, zero radii, vibrant accents',
  palette: Object.freeze({
    background: '#fffbeb',
    surface: '#ffffff',
    border: '#000000',
    primary: '#fde047',
    text: '#000000',
    mutedText: '#4b5563',
  }),
  borders: Object.freeze({
    width: 3,
    radius: 0,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 4,
    y: 4,
    blur: 0,
    color: '#000000',
  }),
  typography: Object.freeze({
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 16,
  }),
});
