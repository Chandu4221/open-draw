import {
  CONTROL_TYPES,
  type PlatformProfile,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const IOS_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "navigation-bar": Object.freeze({
    id: parseSemanticId("navigation-bar"),
    displayName: "Navigation Bar",
    properties: Object.freeze([
      Object.freeze({
        id: "title",
        control: CONTROL_TYPES.text,
        label: "Title",
        defaultValue: "Title",
      }),
      Object.freeze({
        id: "prefersLargeTitles",
        control: CONTROL_TYPES.toggle,
        label: "Large Title",
        defaultValue: false,
      }),
    ]),
  }),
  "tab-bar": Object.freeze({
    id: parseSemanticId("tab-bar"),
    displayName: "Tab Bar",
    properties: Object.freeze([
      Object.freeze({
        id: "translucent",
        control: CONTROL_TYPES.toggle,
        label: "Translucent",
        defaultValue: true,
      }),
    ]),
  }),
  button: Object.freeze({
    id: parseSemanticId("button"),
    displayName: "Button",
    properties: Object.freeze([
      Object.freeze({
        id: "prominence",
        control: CONTROL_TYPES.select,
        label: "Prominence",
        defaultValue: "filled",
        options: Object.freeze([
          Object.freeze({ value: "filled", label: "Filled" }),
          Object.freeze({ value: "tinted", label: "Tinted" }),
          Object.freeze({ value: "gray", label: "Gray" }),
          Object.freeze({ value: "plain", label: "Plain" }),
        ]),
      }),
    ]),
  }),
  "text-field": Object.freeze({
    id: parseSemanticId("text-field"),
    displayName: "Text Field",
    properties: Object.freeze([
      Object.freeze({
        id: "placeholder",
        control: CONTROL_TYPES.text,
        label: "Placeholder",
        defaultValue: "",
      }),
      Object.freeze({
        id: "borderStyle",
        control: CONTROL_TYPES.select,
        label: "Border Style",
        defaultValue: "roundedRect",
        options: Object.freeze([
          Object.freeze({ value: "roundedRect", label: "Rounded Rect" }),
          Object.freeze({ value: "line", label: "Line" }),
          Object.freeze({ value: "none", label: "None" }),
        ]),
      }),
    ]),
  }),
  "segmented-control": Object.freeze({
    id: parseSemanticId("segmented-control"),
    displayName: "Segmented Control",
  }),
  switch: Object.freeze({
    id: parseSemanticId("switch"),
    displayName: "Toggle Switch",
    properties: Object.freeze([
      Object.freeze({
        id: "on",
        control: CONTROL_TYPES.toggle,
        label: "On",
        defaultValue: false,
      }),
    ]),
  }),
  slider: Object.freeze({
    id: parseSemanticId("slider"),
    displayName: "Slider",
  }),
  card: Object.freeze({
    id: parseSemanticId("card"),
    displayName: "Grouped Inset Card",
  }),
  alert: Object.freeze({
    id: parseSemanticId("alert"),
    displayName: "Alert Dialog",
  }),
});

export const IOS_PROFILE: PlatformProfile = Object.freeze({
  id: "ios",
  label: "iOS (HIG)",
  rootSemantic: parseSemanticId("screen"),
  semantics: IOS_SEMANTICS,
});
