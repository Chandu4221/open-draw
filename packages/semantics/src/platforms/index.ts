import type { PlatformProfile } from './types.js';
import { webProfile } from './web.js';
import { androidProfile } from './android.js';
import { flutterProfile } from './flutter.js';

export * from './types.js';
export { webProfile } from './web.js';
export { androidProfile } from './android.js';
export { flutterProfile } from './flutter.js';

const PROFILES: Readonly<Record<string, PlatformProfile>> = Object.freeze({
  web: webProfile,
  android: androidProfile,
  flutter: flutterProfile,
});

export function getPlatformProfile(id: string): PlatformProfile | undefined {
  return PROFILES[id];
}

export function listPlatformProfiles(): readonly PlatformProfile[] {
  return Object.values(PROFILES);
}
