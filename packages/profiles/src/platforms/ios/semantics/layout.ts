import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const IOS_LAYOUT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  card: Object.freeze({
    id: parseSemanticId("card"),
    displayName: "Grouped Inset Card",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "component",
  }),
  "list-row": Object.freeze({
    id: parseSemanticId("list-row"),
    displayName: "List Row",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "accessory",
        control: CONTROL_TYPES.select,
        label: "Accessory",
        defaultValue: "none",
        options: Object.freeze([
          Object.freeze({ value: "none", label: "None" }),
          Object.freeze({ value: "disclosureIndicator", label: "Disclosure Indicator" }),
          Object.freeze({ value: "checkmark", label: "Checkmark" }),
          Object.freeze({ value: "detailButton", label: "Detail Button" }),
        ]),
      }),
    ]),
  }),
  sheet: Object.freeze({
    id: parseSemanticId("sheet"),
    displayName: "Sheet",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "detents",
        control: CONTROL_TYPES.select,
        label: "Detents",
        defaultValue: "medium",
        options: Object.freeze([
          Object.freeze({ value: "medium", label: "Medium" }),
          Object.freeze({ value: "large", label: "Large" }),
          Object.freeze({ value: "both", label: "Medium & Large" }),
        ]),
      }),
    ]),
  }),
  divider: Object.freeze({
    id: parseSemanticId("divider"),
    displayName: "Separator",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "component",
  }),
});
