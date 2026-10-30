// Closed registry: platform profiles (ADR-0002 D6). Values are the serialized
// forms. Vocabulary itself lives in the profiles data modules, not here.
export const PLATFORMS = {
  web: "web",
  androidNative: "android-native",
  flutter: "flutter",
  ios: "ios",
} as const;

export type PlatformId = keyof typeof PLATFORMS;

export const PLATFORM_BY_VALUE: Readonly<Record<string, PlatformId>> = Object.fromEntries(
  (Object.keys(PLATFORMS) as PlatformId[]).map((platform) => [PLATFORMS[platform], platform]),
);
