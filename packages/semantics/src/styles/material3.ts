import type { StyleTokens } from './types.js';

/**
 * Material 3 baseline design style token profile.
 * Tonal palette, rounded radii (12-28px), tonal elevation, Roboto/Google Sans typography.
 * Pure data — zero rendering code, zero canvas knowledge.
 */
export const material3Style: StyleTokens = Object.freeze({
  id: 'material3',
  label: 'Material 3',
  description: 'Tonal elevation, dynamic tonal palette, rounded radii, Material Design 3 tokens',
  notes: 'M3 themes map via Material Theme Builder; Compose MaterialTheme, Flutter ThemeData, Web material-web.',
  platforms: Object.freeze(['android', 'flutter', 'web'] as const),
  palette: Object.freeze({
    background: '#fef7ff',
    surface: '#f3edf7',
    border: '#79747e',
    primary: '#6750a4',
    text: '#1d1b20',
    mutedText: '#49454f',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 16,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 2,
    blur: 6,
    color: 'rgba(0, 0, 0, 0.15)',
  }),
  typography: Object.freeze({
    headingFont: "'Roboto', 'Google Sans', sans-serif",
    bodyFont: "'Roboto', sans-serif",
    baseSize: 16,
  }),
});
