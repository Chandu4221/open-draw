import type { StyleTokens } from './types.js';

export const claymorphismStyle: StyleTokens = Object.freeze({
  id: 'claymorphism',
  label: 'Claymorphism',
  description: 'Inflatable 3D clay aesthetic, chunky pillowy radii, dual soft drop shadows, pastel colors',
  notes: 'Volumetric 3D clay effect featuring high border radii, friendly pastels, and soft pillowy elevation.',
  platforms: Object.freeze(["web","android","flutter"] as const),
  palette: Object.freeze({
    background: '#f0fdf4',
    surface: '#ffffff',
    border: '#bbf7d0',
    primary: '#10b981',
    text: '#064e3b',
    mutedText: '#047857',
  }),
  borders: Object.freeze({
    width: 2,
    radius: 24,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 8,
    y: 12,
    blur: 20,
    color: 'rgba(16, 185, 129, 0.2)',
  }),
  typography: Object.freeze({
    headingFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    baseSize: 16,
  }),
});
