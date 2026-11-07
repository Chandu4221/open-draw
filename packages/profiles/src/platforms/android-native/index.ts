import {
  CONTROL_TYPES,
  type PlatformProfile,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const ANDROID_NATIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze(
  {
    "top-app-bar": Object.freeze({
      id: parseSemanticId("top-app-bar"),
      displayName: "Top App Bar",
      properties: Object.freeze([
        Object.freeze({
          id: "title",
          control: CONTROL_TYPES.text,
          label: "Title",
          defaultValue: "Title",
        }),
        Object.freeze({
          id: "type",
          control: CONTROL_TYPES.select,
          label: "Type",
          defaultValue: "small",
          options: Object.freeze([
            Object.freeze({ value: "small", label: "Small" }),
            Object.freeze({ value: "medium", label: "Medium" }),
            Object.freeze({ value: "large", label: "Large" }),
            Object.freeze({ value: "center-aligned", label: "Center Aligned" }),
          ]),
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
          id: "size",
          control: CONTROL_TYPES.select,
          label: "Size",
          defaultValue: "regular",
          options: Object.freeze([
            Object.freeze({ value: "small", label: "Small" }),
            Object.freeze({ value: "regular", label: "Regular" }),
            Object.freeze({ value: "large", label: "Large" }),
          ]),
        }),
        Object.freeze({
          id: "extended",
          control: CONTROL_TYPES.toggle,
          label: "Extended",
          defaultValue: false,
        }),
      ]),
    }),
    card: Object.freeze({
      id: parseSemanticId("card"),
      displayName: "Material Card",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "elevated",
          options: Object.freeze([
            Object.freeze({ value: "elevated", label: "Elevated" }),
            Object.freeze({ value: "filled", label: "Filled" }),
            Object.freeze({ value: "outlined", label: "Outlined" }),
          ]),
        }),
      ]),
    }),
    button: Object.freeze({
      id: parseSemanticId("button"),
      displayName: "Filled Button",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "filled",
          options: Object.freeze([
            Object.freeze({ value: "filled", label: "Filled" }),
            Object.freeze({ value: "tonal", label: "Tonal" }),
            Object.freeze({ value: "outlined", label: "Outlined" }),
            Object.freeze({ value: "elevated", label: "Elevated" }),
            Object.freeze({ value: "text", label: "Text" }),
          ]),
        }),
        Object.freeze({
          id: "enabled",
          control: CONTROL_TYPES.toggle,
          label: "Enabled",
          defaultValue: true,
        }),
      ]),
    }),
    dialog: Object.freeze({
      id: parseSemanticId("dialog"),
      displayName: "Material Dialog",
    }),
    "bottom-sheet": Object.freeze({
      id: parseSemanticId("bottom-sheet"),
      displayName: "Bottom Sheet",
    }),
    "text-field": Object.freeze({
      id: parseSemanticId("text-field"),
      displayName: "Outlined Text Field",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "outlined",
          options: Object.freeze([
            Object.freeze({ value: "outlined", label: "Outlined" }),
            Object.freeze({ value: "filled", label: "Filled" }),
          ]),
        }),
        Object.freeze({
          id: "label",
          control: CONTROL_TYPES.text,
          label: "Label",
          defaultValue: "Label",
        }),
        Object.freeze({
          id: "supportingText",
          control: CONTROL_TYPES.text,
          label: "Supporting Text",
          defaultValue: "",
        }),
      ]),
    }),
    switch: Object.freeze({
      id: parseSemanticId("switch"),
      displayName: "Switch Toggle",
      properties: Object.freeze([
        Object.freeze({
          id: "checked",
          control: CONTROL_TYPES.toggle,
          label: "Checked",
          defaultValue: false,
        }),
      ]),
    }),
    checkbox: Object.freeze({
      id: parseSemanticId("checkbox"),
      displayName: "Material Checkbox",
      properties: Object.freeze([
        Object.freeze({
          id: "checked",
          control: CONTROL_TYPES.toggle,
          label: "Checked",
          defaultValue: false,
        }),
      ]),
    }),
    chip: Object.freeze({
      id: parseSemanticId("chip"),
      displayName: "Assist / Filter Chip",
      properties: Object.freeze([
        Object.freeze({
          id: "selected",
          control: CONTROL_TYPES.toggle,
          label: "Selected",
          defaultValue: false,
        }),
      ]),
    }),
    "tab-row": Object.freeze({
      id: parseSemanticId("tab-row"),
      displayName: "Primary Tab Row",
    }),
    badge: Object.freeze({
      id: parseSemanticId("badge"),
      displayName: "Badge Indicator",
    }),
  },
);

export const ANDROID_NATIVE_PROFILE: PlatformProfile = Object.freeze({
  id: "androidNative",
  label: "Android (Material 3)",
  rootSemantic: parseSemanticId("screen"),
  semantics: ANDROID_NATIVE_SEMANTICS,
});
