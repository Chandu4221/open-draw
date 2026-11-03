// Closed registry of UI/visual design styles for AI/developer Markdown handoff.
// Zero dependencies, pure data types and registries (R-005, R-007, R-014).

export const DESIGN_STYLES = {
  // Modern & Contemporary
  minimalism: "minimalism",
  modernMinimalism: "modern-minimalism",
  flatDesign: "flat-design",
  cleanCorporate: "clean-corporate",
  editorial: "editorial",
  swissStyle: "swiss-style",

  // Depth & Surface Effects
  glassmorphism: "glassmorphism",
  neumorphism: "neumorphism",
  claymorphism: "claymorphism",
  frostedGlass: "frosted-glass",
  softShadows: "soft-shadows",

  // Bold & Experimental
  brutalism: "brutalism",
  neoBrutalism: "neo-brutalism",
  antiDesign: "anti-design",
  maximalism: "maximalism",
  deconstructivism: "deconstructivism",

  // Retro & Nostalgic
  retro90s: "retro-90s",
  y2k: "y2k",
  cyberpunk: "cyberpunk",
  synthwave: "synthwave",
  pixelArt: "pixel-art",

  // Layout & Content Focused
  bentoGrid: "bento-grid",
  cardBased: "card-based",
  dashboardFirst: "dashboard-first",
  modularGrid: "modular-grid",

  // Luxury & Premium
  luxuryMinimalism: "luxury-minimalism",
  darkLuxury: "dark-luxury",
  artDeco: "art-deco",

  // Technical & Specialized
  terminalMonospace: "terminal-monospace",
  blueprint: "blueprint",
  monochrome: "monochrome",
} as const;

export type DesignStyleId = (typeof DESIGN_STYLES)[keyof typeof DESIGN_STYLES];

export const DESIGN_STYLE_BY_VALUE: Readonly<Record<string, DesignStyleId>> = Object.freeze(
  Object.fromEntries(
    (Object.keys(DESIGN_STYLES) as (keyof typeof DESIGN_STYLES)[]).map((key) => [
      DESIGN_STYLES[key],
      DESIGN_STYLES[key],
    ]),
  ),
);

export const DESIGN_STYLE_LABELS: Readonly<Record<DesignStyleId, string>> = Object.freeze({
  [DESIGN_STYLES.minimalism]: "Minimalism",
  [DESIGN_STYLES.modernMinimalism]: "Modern Minimalism",
  [DESIGN_STYLES.flatDesign]: "Flat Design",
  [DESIGN_STYLES.cleanCorporate]: "Clean Corporate",
  [DESIGN_STYLES.editorial]: "Editorial",
  [DESIGN_STYLES.swissStyle]: "Swiss Style",
  [DESIGN_STYLES.glassmorphism]: "Glassmorphism",
  [DESIGN_STYLES.neumorphism]: "Neumorphism",
  [DESIGN_STYLES.claymorphism]: "Claymorphism",
  [DESIGN_STYLES.frostedGlass]: "Frosted Glass",
  [DESIGN_STYLES.softShadows]: "Soft Shadows",
  [DESIGN_STYLES.brutalism]: "Brutalism",
  [DESIGN_STYLES.neoBrutalism]: "Neo-Brutalism",
  [DESIGN_STYLES.antiDesign]: "Anti-Design",
  [DESIGN_STYLES.maximalism]: "Maximalism",
  [DESIGN_STYLES.deconstructivism]: "Deconstructivism",
  [DESIGN_STYLES.retro90s]: "90s Retro",
  [DESIGN_STYLES.y2k]: "Y2K",
  [DESIGN_STYLES.cyberpunk]: "Cyberpunk",
  [DESIGN_STYLES.synthwave]: "Synthwave",
  [DESIGN_STYLES.pixelArt]: "Pixel Art",
  [DESIGN_STYLES.bentoGrid]: "Bento Grid",
  [DESIGN_STYLES.cardBased]: "Card-Based UI",
  [DESIGN_STYLES.dashboardFirst]: "Dashboard-First",
  [DESIGN_STYLES.modularGrid]: "Modular Grid",
  [DESIGN_STYLES.luxuryMinimalism]: "Luxury Minimalism",
  [DESIGN_STYLES.darkLuxury]: "Dark Luxury",
  [DESIGN_STYLES.artDeco]: "Art Deco",
  [DESIGN_STYLES.terminalMonospace]: "Terminal / Monospace",
  [DESIGN_STYLES.blueprint]: "Blueprint",
  [DESIGN_STYLES.monochrome]: "Monochrome",
});

export function isDesignStyle(value: string): value is DesignStyleId {
  return value in DESIGN_STYLE_BY_VALUE;
}
