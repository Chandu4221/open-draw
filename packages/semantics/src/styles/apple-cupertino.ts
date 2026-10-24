import type { StyleTokens } from './types.js';

export const appleCupertinoStyle: StyleTokens = Object.freeze({
  id: 'apple-cupertino',
  label: 'Apple Cupertino',
  description: 'Apple iOS Human Interface Guidelines, subtle translucent blur, continuous pill curves, system blue',
  notes: 'iOS & macOS design language with SF Pro typography, translucent frosted glass, and continuous curves.',
  platforms: Object.freeze(["web","flutter"] as const),
  palette: Object.freeze({
    background: '#f2f2f7',
    surface: '#ffffff',
    border: '#d1d1d6',
    primary: '#007aff',
    text: '#000000',
    mutedText: '#8e8e93',
  }),
  borders: Object.freeze({
    width: 1,
    radius: 10,
    style: 'solid' as const,
  }),
  shadows: Object.freeze({
    x: 0,
    y: 2,
    blur: 8,
    color: 'rgba(0, 0, 0, 0.08)',
  }),
  typography: Object.freeze({
    headingFont: "-apple-system, 'SF Pro Display', sans-serif",
    bodyFont: "-apple-system, 'SF Pro Text', sans-serif",
    baseSize: 16,
  }),
});
