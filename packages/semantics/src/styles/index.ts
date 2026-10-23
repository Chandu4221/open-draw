import type { StyleTokens } from './types.js';
import { neubrutalismStyle } from './neubrutalism.js';

export * from './types.js';
export { neubrutalismStyle } from './neubrutalism.js';

const STYLES: Readonly<Record<string, StyleTokens>> = Object.freeze({
  neubrutalism: neubrutalismStyle,
});

export function getStyleProfile(id: string): StyleTokens | undefined {
  return STYLES[id];
}

export function listStyleProfiles(): readonly StyleTokens[] {
  return Object.values(STYLES);
}
