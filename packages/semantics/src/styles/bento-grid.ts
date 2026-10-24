import type { StyleTokens } from './types.js';

export const bentoGridStyle: StyleTokens = Object.freeze({
  id: 'bento-grid',
  label: 'Bento Grid',
  description: 'Modular compartmentalized card tiles, uniform gutter hierarchy, clean modern badges',
  notes: 'Modular bento box layout structure with independent rounded tile surfaces and high contrast.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    primary: '#0f172a',
    text: '#0f172a',
    mutedText: '#64748b',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 16,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 1,
    blur: 3,
    color: 'rgba(0, 0, 0, 0.05)',
  }),
  typography: Object.freeze({
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 15,
  }),
});
