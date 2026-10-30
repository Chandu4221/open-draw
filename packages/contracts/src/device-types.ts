// Closed registry: web device types — form-factor width buckets (ADR-0002 D6,
// R-028). NOT a device taxonomy: a device type is the width class a shape's
// responsive data targets. Keys are the type-level ids; values are the
// serialized forms (kebab-case).
export const DEVICE_TYPES = {
  mobile: "mobile",
  tablet: "tablet",
  laptop: "laptop",
  desktop: "desktop",
  largeScreen: "large-screen",
} as const;

export type DeviceType = keyof typeof DEVICE_TYPES;

export const DEVICE_TYPE_BY_VALUE: Readonly<Record<string, DeviceType>> = Object.fromEntries(
  (Object.keys(DEVICE_TYPES) as DeviceType[]).map((deviceType) => [
    DEVICE_TYPES[deviceType],
    deviceType,
  ]),
);
