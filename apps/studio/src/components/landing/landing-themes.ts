import type { LandingDesignStyle, LandingThemeTokens } from "./landing-types.js";
import { MINIMAL_THEME, GLASS_THEME, EDITORIAL_THEME } from "./landing-themes-modern.js";
import { BRUTALIST_THEME, RETRO_THEME } from "./landing-themes-expressive.js";

export { MINIMAL_THEME, GLASS_THEME, EDITORIAL_THEME } from "./landing-themes-modern.js";

export { BRUTALIST_THEME, RETRO_THEME } from "./landing-themes-expressive.js";

export const LANDING_THEMES: Record<LandingDesignStyle, LandingThemeTokens> = {
  minimal: MINIMAL_THEME,
  brutalist: BRUTALIST_THEME,
  glass: GLASS_THEME,
  editorial: EDITORIAL_THEME,
  retro: RETRO_THEME,
};
