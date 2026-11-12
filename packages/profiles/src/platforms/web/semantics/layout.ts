import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const LAYOUT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "app-shell": Object.freeze({
    id: parseSemanticId("app-shell"),
    displayName: "App Shell",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  header: Object.freeze({
    id: parseSemanticId("header"),
    displayName: "Header",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  footer: Object.freeze({
    id: parseSemanticId("footer"),
    displayName: "Footer",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
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
  container: Object.freeze({
    id: parseSemanticId("container"),
    displayName: "Container",
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
  "sticky-header": Object.freeze({
    id: parseSemanticId("sticky-header"),
    displayName: "Sticky Header",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  "fixed-footer": Object.freeze({
    id: parseSemanticId("fixed-footer"),
    displayName: "Fixed Footer",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  "announcement-bar": Object.freeze({
    id: parseSemanticId("announcement-bar"),
    displayName: "Announcement Bar",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
  "breadcrumb-bar": Object.freeze({
    id: parseSemanticId("breadcrumb-bar"),
    displayName: "Breadcrumb Bar",
    category: SEMANTIC_CATEGORIES.layout,
    scope: "section",
  }),
});
