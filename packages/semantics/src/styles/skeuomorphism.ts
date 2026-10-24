import type { StyleTokens } from './types.js';

export const skeuomorphismStyle: StyleTokens = Object.freeze({
  id: 'skeuomorphism',
  label: 'Modern Skeuomorphism',
  description: 'Tactile realism, subtle bevels, inset specular highlights, gradient depths',
  notes: 'Realistic tactile materials with subtle specular edge highlights and soft layered gradients.',
  platforms: Object.freeze(["web","android","flutter"] as const),
  palette: Object.freeze({
    background: '#e5e7eb',
    surface: '#f3f4f6',
    border: '#d1d5db',
    primary: '#2563eb',
    text: '#111827',
    mutedText: '#4b5563',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 12,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 4,
    blur: 8,
    color: 'rgba(0, 0, 0, 0.12)',
  }),
  typography: Object.freeze({
    headingFont: "'SF Pro Display', -apple-system, sans-serif",
    bodyFont: "'SF Pro Text', -apple-system, sans-serif",
    baseSize: 15,
  }),
});
