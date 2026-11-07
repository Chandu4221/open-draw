import {
  PLATFORM_BY_VALUE,
  type PlatformId,
  type SemanticId,
  parseSemanticId,
} from "@open-draw/contracts";

/**
 * Universal UI concepts mapped to equivalent semantic tag identifiers on each platform.
 */
export const HARMONIZED_CONCEPTS: Readonly<
  Record<string, Readonly<Partial<Record<PlatformId, string>>>>
> = Object.freeze({
  header: Object.freeze({
    web: "navbar",
    androidNative: "top-app-bar",
    flutter: "app-bar",
    ios: "navigation-bar",
  }),
  bottomNav: Object.freeze({
    web: "navbar",
    androidNative: "navigation-bar",
    flutter: "bottom-navigation-bar",
    ios: "tab-bar",
  }),
  button: Object.freeze({
    web: "button",
    androidNative: "button",
    flutter: "elevated-button",
    ios: "button",
  }),
  card: Object.freeze({
    web: "card",
    androidNative: "card",
    flutter: "card",
    ios: "card",
  }),
  input: Object.freeze({
    web: "input",
    androidNative: "text-field",
    flutter: "text-field",
    ios: "text-field",
  }),
  dialog: Object.freeze({
    web: "dialog",
    androidNative: "dialog",
    flutter: "dialog",
    ios: "alert",
  }),
  switch: Object.freeze({
    web: "checkbox",
    androidNative: "switch",
    flutter: "switch",
    ios: "switch",
  }),
  tabs: Object.freeze({
    web: "tabs",
    androidNative: "tab-row",
    ios: "segmented-control",
  }),
});

function normalizePlatform(platform: PlatformId | string): PlatformId {
  return (PLATFORM_BY_VALUE[platform] ?? platform) as PlatformId;
}

/**
 * Suggests an equivalent semantic ID when migrating a shape from sourcePlatform to targetPlatform (Idea 2, R-025).
 * Pure function: does not alter the document or enforce automatic mutation.
 */
export function suggestPlatformEquivalent(
  sourcePlatform: PlatformId | string,
  targetPlatform: PlatformId | string,
  semanticId: string,
): SemanticId | undefined {
  const normSource = normalizePlatform(sourcePlatform);
  const normTarget = normalizePlatform(targetPlatform);

  if (normSource === normTarget) {
    return parseSemanticId(semanticId);
  }

  for (const mapping of Object.values(HARMONIZED_CONCEPTS)) {
    if (mapping[normSource] === semanticId && mapping[normTarget] !== undefined) {
      return parseSemanticId(mapping[normTarget]!);
    }
  }

  return undefined;
}

/**
 * Returns all platform equivalents for a given semantic tag if it belongs to a known harmonized concept.
 */
export function getPlatformEquivalents(
  semanticId: string,
  currentPlatform: PlatformId | string,
): Readonly<Partial<Record<PlatformId, SemanticId>>> {
  const normCurrent = normalizePlatform(currentPlatform);
  const result: Partial<Record<PlatformId, SemanticId>> = {};

  for (const mapping of Object.values(HARMONIZED_CONCEPTS)) {
    if (mapping[normCurrent] === semanticId) {
      for (const [platform, tag] of Object.entries(mapping)) {
        if (tag !== undefined) {
          result[platform as PlatformId] = parseSemanticId(tag);
        }
      }
      break;
    }
  }

  return Object.freeze(result);
}
