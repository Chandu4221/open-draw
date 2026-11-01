// Flutter Platform Profile Stub (ADR-0004 D5, R-023).
import {
  type PlatformProfile,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const FLUTTER_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  scaffold: Object.freeze({
    id: parseSemanticId("scaffold"),
    displayName: "Scaffold",
  }),
  "app-bar": Object.freeze({
    id: parseSemanticId("app-bar"),
    displayName: "AppBar",
  }),
  "elevated-button": Object.freeze({
    id: parseSemanticId("elevated-button"),
    displayName: "ElevatedButton",
  }),
});

export const FLUTTER_PROFILE: PlatformProfile = Object.freeze({
  id: "flutter",
  label: "Flutter",
  rootSemantic: parseSemanticId("scaffold"),
  semantics: FLUTTER_SEMANTICS,
});
