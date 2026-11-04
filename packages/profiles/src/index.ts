// @open-draw/profiles — platform and style profile data modules (ADR-0004 D5).
// Pure data; core engine contains zero platform vocabularies (R-023).
import {
  PLATFORM_BY_VALUE,
  type PlatformId,
  type PlatformProfile,
  type StyleId,
  type StyleProfile,
} from "@open-draw/contracts";
import { ANDROID_NATIVE_PROFILE } from "./platforms/android-native";
import { FLUTTER_PROFILE } from "./platforms/flutter";
import { IOS_PROFILE } from "./platforms/ios";
import { WEB_PROFILE } from "./platforms/web";
import { MINIMAL_STYLE_PROFILE } from "./styles/minimal";
import { CRAYON_STYLE_PROFILE } from "./styles/crayon";

export * from "./platforms/web";
export * from "./platforms/android-native";
export * from "./platforms/flutter";
export * from "./platforms/ios";
export * from "./styles/minimal";
export * from "./styles/crayon";

export const PLATFORM_PROFILES: Readonly<Record<PlatformId | "android-native", PlatformProfile>> =
  Object.freeze({
    web: WEB_PROFILE,
    androidNative: ANDROID_NATIVE_PROFILE,
    "android-native": ANDROID_NATIVE_PROFILE,
    flutter: FLUTTER_PROFILE,
    ios: IOS_PROFILE,
  });

export const STYLE_PROFILES_REGISTRY: Readonly<Record<StyleId, StyleProfile>> = Object.freeze({
  minimal: MINIMAL_STYLE_PROFILE,
  crayon: CRAYON_STYLE_PROFILE,
});

export function getPlatformProfile(id: PlatformId | string): PlatformProfile | undefined {
  const normalized = (PLATFORM_BY_VALUE[id] ?? id) as PlatformId;
  return PLATFORM_PROFILES[normalized];
}

export function getStyleProfile(id: StyleId): StyleProfile | undefined {
  return STYLE_PROFILES_REGISTRY[id];
}
