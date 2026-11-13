// Closed registry: platform profiles (ADR-0002 D6, R-005, R-007, R-023).
// Values are the serialized forms.
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

export function isPlatformId(value: string): value is PlatformId {
  return value in PLATFORM_BY_VALUE;
}
