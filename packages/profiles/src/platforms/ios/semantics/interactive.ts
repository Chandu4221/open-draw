import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const IOS_INTERACTIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    button: Object.freeze({
      id: parseSemanticId("button"),
      displayName: "Button",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
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
    "segmented-control": Object.freeze({
      id: parseSemanticId("segmented-control"),
      displayName: "Segmented Control",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
    }),
    menu: Object.freeze({
      id: parseSemanticId("menu"),
      displayName: "Context Menu",
      category: SEMANTIC_CATEGORIES.interactive,
      scope: "component",
    }),
  });
