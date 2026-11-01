// @open-draw/profiles — platform and style profile data modules (ADR-0004 D5).
// Pure data; core engine contains zero platform vocabularies (R-023).
import type { PlatformId, PlatformProfile, StyleId, StyleProfile } from "@open-draw/contracts";
import { ANDROID_NATIVE_PROFILE } from "./platforms/android-native";
import { FLUTTER_PROFILE } from "./platforms/flutter";
import { WEB_PROFILE } from "./platforms/web";
import { MINIMAL_STYLE_PROFILE } from "./styles/minimal";

export * from "./platforms/web";
export * from "./platforms/android-native";
export * from "./platforms/flutter";
export * from "./styles/minimal";

export const PLATFORM_PROFILES: Readonly<Record<PlatformId, PlatformProfile>> = Object.freeze({
  web: WEB_PROFILE,
  androidNative: ANDROID_NATIVE_PROFILE,
  flutter: FLUTTER_PROFILE,
  ios: Object.freeze({
    id: "ios",
    label: "iOS",
    rootSemantic: WEB_PROFILE.rootSemantic,
    semantics: {},
  }),
});

export const STYLE_PROFILES_REGISTRY: Readonly<Record<StyleId, StyleProfile>> = Object.freeze({
  minimal: MINIMAL_STYLE_PROFILE,
});

export function getPlatformProfile(id: PlatformId): PlatformProfile | undefined {
  return PLATFORM_PROFILES[id];
}

export function getStyleProfile(id: StyleId): StyleProfile | undefined {
  return STYLE_PROFILES_REGISTRY[id];
}
