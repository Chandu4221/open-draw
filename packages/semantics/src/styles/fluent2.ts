import type { StyleTokens } from './types.js';

export const fluent2Style: StyleTokens = Object.freeze({
  id: 'fluent2',
  label: 'Microsoft Fluent',
  description: 'Microsoft Fluent 2 design language, Mica translucent depth, Segoe UI, subtle elevation',
  notes: 'Windows 11 and Microsoft 365 design system featuring Mica surfaces, soft shadows, and 4-8px radii.',
  platforms: Object.freeze(["web"] as const),
  palette: Object.freeze({
    background: '#f3f3f3',
    surface: '#ffffff',
    border: '#e5e5e5',
    primary: '#0078d4',
    text: '#242424',
    mutedText: '#616161',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 6,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 2,
    blur: 4,
    color: 'rgba(0, 0, 0, 0.14)',
  }),
  typography: Object.freeze({
    headingFont: "'Segoe UI Variable Display', 'Segoe UI', sans-serif",
    bodyFont: "'Segoe UI Variable Text', 'Segoe UI', sans-serif",
    baseSize: 14,
  }),
});
