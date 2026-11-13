import type { PlatformProfile } from "../../profile-contract";
import { parseSemanticId } from "../../semantic-contract";
import { WEB_SEMANTICS } from "./semantics/index.js";

export * from "./semantics/index.js";

export const WEB_PROFILE: PlatformProfile = Object.freeze({
  id: "web",
  label: "Web",
  rootSemantic: parseSemanticId("page"),
  deviceTypes: Object.freeze(["mobile", "tablet", "laptop", "desktop", "largeScreen"] as const),
  semantics: WEB_SEMANTICS,
});
