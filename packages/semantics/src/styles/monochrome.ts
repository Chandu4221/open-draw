import type { StyleTokens } from './types.js';

export const monochromeStyle: StyleTokens = Object.freeze({
  id: 'monochrome',
  label: 'Monochrome',
  description: 'Pure grayscale palette (#000000 to #ffffff), zero chroma, stark typographic hierarchy',
  notes: 'Achromatic design system relying solely on typographic contrast, line weights, and grayscale tone.',
  platforms: Object.freeze(["web","android","flutter"] as const),
  palette: Object.freeze({
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#0f172a',
    primary: '#0f172a',
    text: '#0f172a',
    mutedText: '#64748b',
  }),
  borders: Object.freeze({
    width: 1.5,
    radius: 6,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 2,
    blur: 4,
    color: 'rgba(0, 0, 0, 0.08)',
  }),
  typography: Object.freeze({
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    baseSize: 15,
  }),
});
