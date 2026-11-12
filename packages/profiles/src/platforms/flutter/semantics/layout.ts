import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const FLUTTER_LAYOUT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze(
  {
    card: Object.freeze({
      id: parseSemanticId("card"),
      displayName: "Card",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "elevation",
          control: CONTROL_TYPES.select,
          label: "Elevation",
          defaultValue: "low",
          options: Object.freeze([
            Object.freeze({ value: "low", label: "Low" }),
            Object.freeze({ value: "medium", label: "Medium" }),
            Object.freeze({ value: "high", label: "High" }),
          ]),
        }),
      ]),
    }),
    "list-tile": Object.freeze({
      id: parseSemanticId("list-tile"),
      displayName: "ListTile",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "dense",
          control: CONTROL_TYPES.toggle,
          label: "Dense",
          defaultValue: false,
        }),
      ]),
    }),
    divider: Object.freeze({
      id: parseSemanticId("divider"),
      displayName: "Divider",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "component",
    }),
    drawer: Object.freeze({
      id: parseSemanticId("drawer"),
      displayName: "Drawer",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "section",
    }),
    "bottom-sheet": Object.freeze({
      id: parseSemanticId("bottom-sheet"),
      displayName: "Bottom Sheet",
      category: SEMANTIC_CATEGORIES.layout,
      scope: "section",
    }),
  },
);
