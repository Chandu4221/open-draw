import { type PlatformProfile, parseSemanticId } from "@open-draw/contracts";
import { FLUTTER_SEMANTICS } from "./semantics/index.js";

export * from "./semantics/index.js";

export const FLUTTER_PROFILE: PlatformProfile = Object.freeze({
  id: "flutter",
  label: "Flutter",
  rootSemantic: parseSemanticId("scaffold"),
  semantics: FLUTTER_SEMANTICS,
});
