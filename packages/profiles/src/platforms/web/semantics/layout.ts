import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const LAYOUT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  header: Object.freeze({
    id: parseSemanticId("header"),
    displayName: "Header",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "sticky",
        control: CONTROL_TYPES.toggle,
        label: "Sticky",
        defaultValue: false,
      }),
    ]),
  }),
  footer: Object.freeze({
    id: parseSemanticId("footer"),
    displayName: "Footer",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "fixed",
        control: CONTROL_TYPES.toggle,
        label: "Fixed",
        defaultValue: false,
      }),
    ]),
  }),
  sidebar: Object.freeze({
    id: parseSemanticId("sidebar"),
    displayName: "Sidebar",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "collapsible",
        control: CONTROL_TYPES.toggle,
        label: "Collapsible",
        defaultValue: false,
      }),
    ]),
  }),
  "main-content": Object.freeze({
    id: parseSemanticId("main-content"),
    displayName: "Main Content",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  section: Object.freeze({
    id: parseSemanticId("section"),
    displayName: "Section",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  grid: Object.freeze({
    id: parseSemanticId("grid"),
    displayName: "Grid Layout",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  "split-view": Object.freeze({
    id: parseSemanticId("split-view"),
    displayName: "Split View",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
});
