import type { StyleTokens } from './types.js';

export const cyberpunkStyle: StyleTokens = Object.freeze({
  id: 'cyberpunk',
  label: 'Cyberpunk',
  description: 'High-contrast electric neon yellow, cyan, and magenta on pitch black with chamfered geometry',
  notes: 'Futuristic dystopian HUD aesthetic with saturated neon accents, dark grids, and angled accents.',
  platforms: Object.freeze(["web","android","flutter"] as const),
  palette: Object.freeze({
    background: '#05050a',
    surface: '#0f101e',
    border: '#00f0ff',
    primary: '#fcee0a',
    text: '#00f0ff',
    mutedText: '#ff003c',
  }),
  borders: Object.freeze({
    width: 2,
    radius: 2,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 0,
    blur: 12,
    color: 'rgba(0, 240, 255, 0.4)',
  }),
  typography: Object.freeze({
    headingFont: "'Rajdhani', 'Orbitron', sans-serif",
    bodyFont: "'Chakra Petch', sans-serif",
    baseSize: 14,
  }),
});
