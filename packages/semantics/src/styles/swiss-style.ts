import type { StyleTokens } from './types.js';

export const swissStyle: StyleTokens = Object.freeze({
  id: 'swiss-style',
  label: 'Swiss Style',
  description: 'International Typographic Style, asymmetric grid, stark black/white/red contrast, zero radius',
  notes: 'Functional modernist design inspired by Josef Müller-Brockmann: strict grid hierarchy and bold typography.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#f5f5f5',
    surface: '#ffffff',
    border: '#000000',
    primary: '#e11d48',
    text: '#000000',
    mutedText: '#525252',
  }),
  borders: Object.freeze({
    width: 2,
    radius: 0,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 0,
    blur: 0,
    color: 'transparent',
  }),
  typography: Object.freeze({
    headingFont: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    bodyFont: "'Helvetica Neue', 'Helvetica', sans-serif",
    baseSize: 16,
  }),
});
