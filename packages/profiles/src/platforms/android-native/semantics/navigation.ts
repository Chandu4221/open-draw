import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const ANDROID_NAVIGATION_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    "top-app-bar": Object.freeze({
      id: parseSemanticId("top-app-bar"),
      displayName: "Top App Bar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "title",
          control: CONTROL_TYPES.text,
          label: "Title",
          defaultValue: "Title",
        }),
        Object.freeze({
          id: "type",
          control: CONTROL_TYPES.select,
          label: "Type",
          defaultValue: "small",
          options: Object.freeze([
            Object.freeze({ value: "small", label: "Small" }),
            Object.freeze({ value: "medium", label: "Medium" }),
            Object.freeze({ value: "large", label: "Large" }),
            Object.freeze({ value: "center-aligned", label: "Center Aligned" }),
          ]),
        }),
      ]),
    }),
    "bottom-app-bar": Object.freeze({
      id: parseSemanticId("bottom-app-bar"),
      displayName: "Bottom App Bar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
    }),
    "navigation-bar": Object.freeze({
      id: parseSemanticId("navigation-bar"),
      displayName: "Navigation Bar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
    }),
    "navigation-rail": Object.freeze({
      id: parseSemanticId("navigation-rail"),
      displayName: "Navigation Rail",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "header",
          control: CONTROL_TYPES.toggle,
          label: "Header Slot",
          defaultValue: true,
        }),
      ]),
    }),
    "navigation-drawer": Object.freeze({
      id: parseSemanticId("navigation-drawer"),
      displayName: "Navigation Drawer",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "modal",
          options: Object.freeze([
            Object.freeze({ value: "modal", label: "Modal" }),
            Object.freeze({ value: "permanent", label: "Permanent" }),
          ]),
        }),
      ]),
    }),
    "tab-row": Object.freeze({
      id: parseSemanticId("tab-row"),
      displayName: "Primary Tab Row",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "primary",
          options: Object.freeze([
            Object.freeze({ value: "primary", label: "Primary" }),
            Object.freeze({ value: "secondary", label: "Secondary" }),
          ]),
        }),
      ]),
    }),
    "search-bar": Object.freeze({
      id: parseSemanticId("search-bar"),
      displayName: "Search Bar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "placeholder",
          control: CONTROL_TYPES.text,
          label: "Placeholder",
          defaultValue: "Search...",
        }),
        Object.freeze({
          id: "docked",
          control: CONTROL_TYPES.toggle,
          label: "Docked",
          defaultValue: false,
        }),
      ]),
    }),
  });
