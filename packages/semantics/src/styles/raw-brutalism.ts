import type { StyleTokens } from './types.js';

export const rawBrutalismStyle: StyleTokens = Object.freeze({
  id: 'raw-brutalism',
  label: 'Raw Brutalism',
  description: 'Unstyled HTML wireframe aesthetic, system monospace fonts, exposed outlines, raw utility',
  notes: 'Unembellished brutalist web design emphasizing functional raw markup and harsh outlines.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#ffffff',
    surface: '#ffffff',
    border: '#000000',
    primary: '#0000ee',
    text: '#000000',
    mutedText: '#555555',
  }),
  borders: Object.freeze({
    width: 1,
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
    headingFont: "monospace",
    bodyFont: "monospace",
    baseSize: 14,
  }),
});
