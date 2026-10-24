import type { StyleTokens } from './types.js';

export const win95RetroStyle: StyleTokens = Object.freeze({
  id: 'win95-retro',
  label: 'Win95 Retro',
  description: 'Classic 3D beveled raised and sunken borders, classic teal desktop, 0px corner radii',
  notes: 'Nostalgic 1990s desktop operating system look with sharp beveled edges and muted silver/teal.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#008080',
    surface: '#c0c0c0',
    border: '#808080',
    primary: '#000080',
    text: '#000000',
    mutedText: '#404040',
  }),
  borders: Object.freeze({
    width: 2,
    radius: 0,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 2,
    y: 2,
    blur: 0,
    color: '#000000',
  }),
  typography: Object.freeze({
    headingFont: "'MS Sans Serif', 'Tahoma', sans-serif",
    bodyFont: "'MS Sans Serif', 'Tahoma', sans-serif",
    baseSize: 13,
  }),
});
