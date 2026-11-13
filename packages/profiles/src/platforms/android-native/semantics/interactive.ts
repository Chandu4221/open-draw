import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const ANDROID_INTERACTIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    button: Object.freeze({
      id: parseSemanticId("button"),
      displayName: "Filled Button",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
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
    "icon-button": Object.freeze({
      id: parseSemanticId("icon-button"),
      displayName: "Icon Button",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "standard",
          options: Object.freeze([
            Object.freeze({ value: "standard", label: "Standard" }),
            Object.freeze({ value: "filled", label: "Filled" }),
            Object.freeze({ value: "tonal", label: "Tonal" }),
            Object.freeze({ value: "outlined", label: "Outlined" }),
          ]),
        }),
      ]),
    }),
    "floating-action-button": Object.freeze({
      id: parseSemanticId("floating-action-button"),
      displayName: "Floating Action Button",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
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
        Object.freeze({
          id: "label",
          control: CONTROL_TYPES.text,
          label: "Label",
          defaultValue: "",
        }),
      ]),
    }),
    "segmented-button": Object.freeze({
      id: parseSemanticId("segmented-button"),
      displayName: "Segmented Button",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "selectionMode",
          control: CONTROL_TYPES.select,
          label: "Selection Mode",
          defaultValue: "single",
          options: Object.freeze([
            Object.freeze({ value: "single", label: "Single Choice" }),
            Object.freeze({ value: "multi", label: "Multi Choice" }),
          ]),
        }),
      ]),
    }),
  });
