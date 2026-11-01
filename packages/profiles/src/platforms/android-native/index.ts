// Android Native (Material 3) Platform Profile (ADR-0004 D5, R-023).
import {
  type PlatformProfile,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const ANDROID_NATIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze(
  {
    screen: Object.freeze({
      id: parseSemanticId("screen"),
      displayName: "Screen",
    }),
    "top-app-bar": Object.freeze({
      id: parseSemanticId("top-app-bar"),
      displayName: "Top App Bar",
      properties: Object.freeze([
        Object.freeze({
          id: "title",
          control: "text",
          label: "Title",
          defaultValue: "Title",
        }),
      ]),
    }),
    "navigation-bar": Object.freeze({
      id: parseSemanticId("navigation-bar"),
      displayName: "Navigation Bar",
    }),
    "floating-action-button": Object.freeze({
      id: parseSemanticId("floating-action-button"),
      displayName: "Floating Action Button",
      properties: Object.freeze([
        Object.freeze({
          id: "extended",
          control: "toggle",
          label: "Extended",
          defaultValue: false,
        }),
      ]),
    }),
    card: Object.freeze({
      id: parseSemanticId("card"),
      displayName: "Material Card",
    }),
    button: Object.freeze({
      id: parseSemanticId("button"),
      displayName: "Filled Button",
      properties: Object.freeze([
        Object.freeze({
          id: "enabled",
          control: "toggle",
          label: "Enabled",
          defaultValue: true,
        }),
      ]),
    }),
  },
);

export const ANDROID_NATIVE_PROFILE: PlatformProfile = Object.freeze({
  id: "androidNative",
  label: "Android (Material 3)",
  rootSemantic: parseSemanticId("screen"),
  semantics: ANDROID_NATIVE_SEMANTICS,
});
