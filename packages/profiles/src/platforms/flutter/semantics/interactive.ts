import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const FLUTTER_INTERACTIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    button: Object.freeze({
      id: parseSemanticId("button"),
      displayName: "Button",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
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
            Object.freeze({ value: "text", label: "Text" }),
          ]),
        }),
      ]),
    }),
    "icon-button": Object.freeze({
      id: parseSemanticId("icon-button"),
      displayName: "IconButton",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
    }),
    "floating-action-button": Object.freeze({
      id: parseSemanticId("floating-action-button"),
      displayName: "FloatingActionButton",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "mini",
          control: CONTROL_TYPES.toggle,
          label: "Mini",
          defaultValue: false,
        }),
        Object.freeze({
          id: "extended",
          control: CONTROL_TYPES.toggle,
          label: "Extended",
          defaultValue: false,
        }),
      ]),
    }),
    "segmented-button": Object.freeze({
      id: parseSemanticId("segmented-button"),
      displayName: "SegmentedButton",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
    }),
  });
