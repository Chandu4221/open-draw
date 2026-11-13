import type { PlatformProfile } from "../../profile-contract";
import { parseSemanticId } from "../../semantic-contract";
import { ANDROID_NATIVE_SEMANTICS } from "./semantics/index.js";

export * from "./semantics/index.js";

export const ANDROID_NATIVE_PROFILE: PlatformProfile = Object.freeze({
  id: "androidNative",
  label: "Android (Material 3)",
  rootSemantic: parseSemanticId("screen"),
  semantics: ANDROID_NATIVE_SEMANTICS,
});
