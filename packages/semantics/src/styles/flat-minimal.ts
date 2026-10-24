import type { StyleTokens } from './types.js';

/**
 * Flat minimal design style token profile.
 * Neutral grayscale palette + single accent, 0-4px radii, no shadows, system font stack.
 * Pure data — zero rendering code, zero canvas knowledge.
 */
export const flatMinimalStyle: StyleTokens = Object.freeze({
  id: 'flat-minimal',
  label: 'Flat Minimal',
  description: 'Neutral grayscale, single accent, 0-4px radii, zero shadows, clean typography',
  notes: 'Clean typography-first styling with high whitespace ratio and zero decorative elevation.',
  palette: Object.freeze({
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    primary: '#111827',
    text: '#111827',
    mutedText: '#6b7280',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 4,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 0,
    blur: 0,
    color: 'transparent',
  }),
  typography: Object.freeze({
    headingFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    baseSize: 15,
  }),
});
