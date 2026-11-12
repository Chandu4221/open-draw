import { type PlatformProfile, parseSemanticId } from "@open-draw/contracts";
import { WEB_SEMANTICS } from "./semantics/index.js";

export * from "./semantics/index.js";

export const WEB_PROFILE: PlatformProfile = Object.freeze({
  id: "web",
  label: "Web",
  rootSemantic: parseSemanticId("page"),
  deviceTypes: Object.freeze(["mobile", "tablet", "laptop", "desktop", "largeScreen"] as const),
  semantics: WEB_SEMANTICS,
});
