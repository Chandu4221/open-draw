import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const DATA_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  dashboard: Object.freeze({
    id: parseSemanticId("dashboard"),
    displayName: "Dashboard Layout",
    category: SEMANTIC_CATEGORIES.data,
    scope: "section",
  }),
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
  "data-table": Object.freeze({
    id: parseSemanticId("data-table"),
    displayName: "Interactive Data Table",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
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
  "kpi-summary": Object.freeze({
    id: parseSemanticId("kpi-summary"),
    displayName: "KPI Summary",
    category: SEMANTIC_CATEGORIES.data,
    scope: "section",
  }),
  "trend-indicator": Object.freeze({
    id: parseSemanticId("trend-indicator"),
    displayName: "Trend Indicator",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  sparkline: Object.freeze({
    id: parseSemanticId("sparkline"),
    displayName: "Sparkline",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "filter-bar": Object.freeze({
    id: parseSemanticId("filter-bar"),
    displayName: "Filter Bar",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "search-results": Object.freeze({
    id: parseSemanticId("search-results"),
    displayName: "Search Results",
    category: SEMANTIC_CATEGORIES.data,
    scope: "section",
  }),
  "empty-results": Object.freeze({
    id: parseSemanticId("empty-results"),
    displayName: "Empty Results",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "activity-feed": Object.freeze({
    id: parseSemanticId("activity-feed"),
    displayName: "Activity Feed",
    category: SEMANTIC_CATEGORIES.data,
    scope: "section",
  }),
  "kanban-board": Object.freeze({
    id: parseSemanticId("kanban-board"),
    displayName: "Kanban Board",
    category: SEMANTIC_CATEGORIES.data,
    scope: "section",
  }),
  "kanban-column": Object.freeze({
    id: parseSemanticId("kanban-column"),
    displayName: "Kanban Column",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "kanban-card": Object.freeze({
    id: parseSemanticId("kanban-card"),
    displayName: "Kanban Card",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
  "tree-view": Object.freeze({
    id: parseSemanticId("tree-view"),
    displayName: "Tree View",
    category: SEMANTIC_CATEGORIES.data,
    scope: "component",
  }),
});
