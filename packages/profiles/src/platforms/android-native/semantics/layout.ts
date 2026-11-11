import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const ANDROID_LAYOUT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze(
  {
    scaffold: Object.freeze({
      id: parseSemanticId("scaffold"),
      displayName: "Scaffold",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "section",
    }),
    card: Object.freeze({
      id: parseSemanticId("card"),
      displayName: "Material Card",
      category: SEMANTIC_CATEGORIES.layout,
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
          ]),
        }),
      ]),
    }),
    "list-item": Object.freeze({
      id: parseSemanticId("list-item"),
      displayName: "List Item",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "lines",
          control: CONTROL_TYPES.select,
          label: "Lines",
          defaultValue: "single",
          options: Object.freeze([
            Object.freeze({ value: "single", label: "Single Line" }),
            Object.freeze({ value: "two", label: "Two Lines" }),
            Object.freeze({ value: "three", label: "Three Lines" }),
          ]),
        }),
      ]),
    }),
    divider: Object.freeze({
      id: parseSemanticId("divider"),
      displayName: "Divider",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "orientation",
          control: CONTROL_TYPES.select,
          label: "Orientation",
          defaultValue: "horizontal",
          options: Object.freeze([
            Object.freeze({ value: "horizontal", label: "Horizontal" }),
            Object.freeze({ value: "vertical", label: "Vertical" }),
          ]),
        }),
      ]),
    }),
    "bottom-sheet": Object.freeze({
      id: parseSemanticId("bottom-sheet"),
      displayName: "Bottom Sheet",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "dragHandle",
          control: CONTROL_TYPES.toggle,
          label: "Drag Handle",
          defaultValue: true,
        }),
      ]),
    }),
    "side-sheet": Object.freeze({
      id: parseSemanticId("side-sheet"),
      displayName: "Side Sheet",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "modal",
          options: Object.freeze([
            Object.freeze({ value: "modal", label: "Modal" }),
            Object.freeze({ value: "standard", label: "Standard" }),
          ]),
        }),
      ]),
    }),
    carousel: Object.freeze({
      id: parseSemanticId("carousel"),
      displayName: "Carousel",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "component",
    }),
  },
);
