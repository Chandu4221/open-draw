import type { StyleTokens } from './types.js';

export const pixelArtStyle: StyleTokens = Object.freeze({
  id: 'pixel-art',
  label: 'Pixel Art',
  description: 'Chunky 8-bit/16-bit stepped pixel borders, zero blur hard shadows, retro arcade palette',
  notes: 'Nostalgic 8-bit/16-bit gaming aesthetic with thick blocky borders and hard pixel drop-shadows.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#212121',
    surface: '#323232',
    border: '#ffffff',
    primary: '#ffcc00',
    text: '#ffffff',
    mutedText: '#9e9e9e',
  }),
  borders: Object.freeze({
    width: 4,
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
    headingFont: "'Press Start 2P', monospace",
    bodyFont: "'Courier New', monospace",
    baseSize: 12,
  }),
});
