import type { PlatformProfile } from "../../profile-contract";
import { parseSemanticId } from "../../semantic-contract";
import { IOS_SEMANTICS } from "./semantics/index.js";

export * from "./semantics/index.js";

export const IOS_PROFILE: PlatformProfile = Object.freeze({
  id: "ios",
  label: "iOS (HIG)",
  rootSemantic: parseSemanticId("screen"),
  semantics: IOS_SEMANTICS,
});
