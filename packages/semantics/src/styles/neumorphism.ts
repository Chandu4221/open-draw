import type { StyleTokens } from './types.js';

/**
 * Neumorphism design style token profile.
 * Soft embossed UI, dual cast shadows, low-contrast monochrome surfaces, 16-24px radii.
 * Pure data — zero rendering code, zero canvas knowledge.
 */
export const neumorphismStyle: StyleTokens = Object.freeze({
  id: 'neumorphism',
  label: 'Neumorphism',
  description: 'Soft embossed UI, dual cast shadows, low-contrast monochrome surfaces, 16-24px radii',
  notes: 'Soft embossed UI with dual light and dark cast shadows on low-contrast surfaces.',
  platforms: Object.freeze(['web', 'flutter', 'android'] as const),
  palette: Object.freeze({
    background: '#e0e5ec',
    surface: '#e0e5ec',
    border: '#d1d9e6',
    primary: '#3182ce',
    text: '#2d3748',
    mutedText: '#718096',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 20,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 6,
    y: 6,
    blur: 16,
    color: 'rgba(163, 177, 198, 0.60)',
  }),
  typography: Object.freeze({
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 16,
  }),
});
