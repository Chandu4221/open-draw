import type { StyleTokens } from './types.js';
import { neubrutalismStyle } from './neubrutalism.js';
import { material3Style } from './material3.js';
import { flatMinimalStyle } from './flat-minimal.js';
import { glassmorphismStyle } from './glassmorphism.js';
import { neumorphismStyle } from './neumorphism.js';

export * from './types.js';
export { neubrutalismStyle } from './neubrutalism.js';
export { material3Style } from './material3.js';
export { flatMinimalStyle } from './flat-minimal.js';
export { glassmorphismStyle } from './glassmorphism.js';
export { neumorphismStyle } from './neumorphism.js';

const STYLES: Readonly<Record<string, StyleTokens>> = Object.freeze({
  neubrutalism: neubrutalismStyle,
  material3: material3Style,
  'flat-minimal': flatMinimalStyle,
  glassmorphism: glassmorphismStyle,
  neumorphism: neumorphismStyle,
});

export function getStyleProfile(id: string): StyleTokens | undefined {
  return STYLES[id];
}

export function listStyleProfiles(): readonly StyleTokens[] {
  return Object.values(STYLES);
}
