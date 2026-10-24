import type { StyleTokens } from './types.js';
import { neubrutalismStyle } from './neubrutalism.js';
import { material3Style } from './material3.js';
import { flatMinimalStyle } from './flat-minimal.js';
import { glassmorphismStyle } from './glassmorphism.js';
import { neumorphismStyle } from './neumorphism.js';
import { skeuomorphismStyle } from './skeuomorphism.js';
import { claymorphismStyle } from './claymorphism.js';
import { linearModernStyle } from './linear-modern.js';
import { bentoGridStyle } from './bento-grid.js';
import { auroraGlowStyle } from './aurora-glow.js';
import { win95RetroStyle } from './win95-retro.js';
import { cyberpunkStyle } from './cyberpunk.js';
import { synthwaveStyle } from './synthwave.js';
import { pixelArtStyle } from './pixel-art.js';
import { swissStyle } from './swiss-style.js';
import { rawBrutalismStyle } from './raw-brutalism.js';
import { monochromeStyle } from './monochrome.js';
import { appleCupertinoStyle } from './apple-cupertino.js';
import { fluent2Style } from './fluent2.js';

export * from './types.js';
export { neubrutalismStyle } from './neubrutalism.js';
export { material3Style } from './material3.js';
export { flatMinimalStyle } from './flat-minimal.js';
export { glassmorphismStyle } from './glassmorphism.js';
export { neumorphismStyle } from './neumorphism.js';
export { skeuomorphismStyle } from './skeuomorphism.js';
export { claymorphismStyle } from './claymorphism.js';
export { linearModernStyle } from './linear-modern.js';
export { bentoGridStyle } from './bento-grid.js';
export { auroraGlowStyle } from './aurora-glow.js';
export { win95RetroStyle } from './win95-retro.js';
export { cyberpunkStyle } from './cyberpunk.js';
export { synthwaveStyle } from './synthwave.js';
export { pixelArtStyle } from './pixel-art.js';
export { swissStyle } from './swiss-style.js';
export { rawBrutalismStyle } from './raw-brutalism.js';
export { monochromeStyle } from './monochrome.js';
export { appleCupertinoStyle } from './apple-cupertino.js';
export { fluent2Style } from './fluent2.js';

const STYLES: Readonly<Record<string, StyleTokens>> = Object.freeze({
  neubrutalism: neubrutalismStyle,
  material3: material3Style,
  'flat-minimal': flatMinimalStyle,
  glassmorphism: glassmorphismStyle,
  neumorphism: neumorphismStyle,
  skeuomorphism: skeuomorphismStyle,
  claymorphism: claymorphismStyle,
  'linear-modern': linearModernStyle,
  'bento-grid': bentoGridStyle,
  'aurora-glow': auroraGlowStyle,
  'win95-retro': win95RetroStyle,
  cyberpunk: cyberpunkStyle,
  synthwave: synthwaveStyle,
  'pixel-art': pixelArtStyle,
  'swiss-style': swissStyle,
  'raw-brutalism': rawBrutalismStyle,
  monochrome: monochromeStyle,
  'apple-cupertino': appleCupertinoStyle,
  fluent2: fluent2Style,
});

export function getStyleProfile(id: string): StyleTokens | undefined {
  return STYLES[id];
}

export function listStyleProfiles(platformId?: string): readonly StyleTokens[] {
  const all = Object.values(STYLES);
  if (!platformId) return all;
  return all.filter((s) => !s.platforms || s.platforms.includes(platformId));
}
