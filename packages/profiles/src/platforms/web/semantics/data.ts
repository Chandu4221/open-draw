import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const DATA_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  table: Object.freeze({
    id: parseSemanticId("table"),
    displayName: "Data Table",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "striped",
        control: CONTROL_TYPES.toggle,
        label: "Striped",
        defaultValue: false,
      }),
      Object.freeze({
        id: "bordered",
        control: CONTROL_TYPES.toggle,
        label: "Bordered",
        defaultValue: true,
      }),
    ]),
  }),
  chart: Object.freeze({
    id: parseSemanticId("chart"),
    displayName: "Chart Visualization",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "metric-card": Object.freeze({
    id: parseSemanticId("metric-card"),
    displayName: "Metric Card",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "filter-bar": Object.freeze({
    id: parseSemanticId("filter-bar"),
    displayName: "Filter Bar",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "kanban-board": Object.freeze({
    id: parseSemanticId("kanban-board"),
    displayName: "Kanban Board",
    category: SEMANTIC_CATEGORIES.data,
    scope: "section",
  }),
});
