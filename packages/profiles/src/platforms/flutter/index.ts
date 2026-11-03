import {
  CONTROL_TYPES,
  type PlatformProfile,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const FLUTTER_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "app-bar": Object.freeze({
    id: parseSemanticId("app-bar"),
    displayName: "AppBar",
  }),
  "elevated-button": Object.freeze({
    id: parseSemanticId("elevated-button"),
    displayName: "ElevatedButton",
  }),
  "text-field": Object.freeze({
    id: parseSemanticId("text-field"),
    displayName: "TextField",
    properties: Object.freeze([
      Object.freeze({
        id: "obscureText",
        control: CONTROL_TYPES.toggle,
        label: "Obscure Text",
        defaultValue: false,
      }),
    ]),
  }),
  card: Object.freeze({
    id: parseSemanticId("card"),
    displayName: "Card",
  }),
  "floating-action-button": Object.freeze({
    id: parseSemanticId("floating-action-button"),
    displayName: "FloatingActionButton",
    properties: Object.freeze([
      Object.freeze({
        id: "mini",
        control: CONTROL_TYPES.toggle,
        label: "Mini",
        defaultValue: false,
      }),
    ]),
  }),
  "bottom-navigation-bar": Object.freeze({
    id: parseSemanticId("bottom-navigation-bar"),
    displayName: "BottomNavigationBar",
  }),
  dialog: Object.freeze({
    id: parseSemanticId("dialog"),
    displayName: "AlertDialog",
  }),
  checkbox: Object.freeze({
    id: parseSemanticId("checkbox"),
    displayName: "Checkbox",
    properties: Object.freeze([
      Object.freeze({
        id: "value",
        control: CONTROL_TYPES.toggle,
        label: "Checked",
        defaultValue: false,
      }),
    ]),
  }),
  switch: Object.freeze({
    id: parseSemanticId("switch"),
    displayName: "Switch",
    properties: Object.freeze([
      Object.freeze({
        id: "value",
        control: CONTROL_TYPES.toggle,
        label: "Value",
        defaultValue: false,
      }),
    ]),
  }),
  "list-tile": Object.freeze({
    id: parseSemanticId("list-tile"),
    displayName: "ListTile",
    properties: Object.freeze([
      Object.freeze({
        id: "dense",
        control: CONTROL_TYPES.toggle,
        label: "Dense",
        defaultValue: false,
      }),
    ]),
  }),
});

export const FLUTTER_PROFILE: PlatformProfile = Object.freeze({
  id: "flutter",
  label: "Flutter",
  rootSemantic: parseSemanticId("scaffold"),
  semantics: FLUTTER_SEMANTICS,
});
