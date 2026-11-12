import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const FLUTTER_NAVIGATION_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    "app-bar": Object.freeze({
      id: parseSemanticId("app-bar"),
      displayName: "AppBar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "title",
          control: CONTROL_TYPES.text,
          label: "Title",
          defaultValue: "App Title",
        }),
        Object.freeze({
          id: "centerTitle",
          control: CONTROL_TYPES.toggle,
          label: "Center Title",
          defaultValue: false,
        }),
      ]),
    }),
    "bottom-navigation-bar": Object.freeze({
      id: parseSemanticId("bottom-navigation-bar"),
      displayName: "BottomNavigationBar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "type",
          control: CONTROL_TYPES.select,
          label: "Type",
          defaultValue: "fixed",
          options: Object.freeze([
            Object.freeze({ value: "fixed", label: "Fixed" }),
            Object.freeze({ value: "shifting", label: "Shifting" }),
          ]),
        }),
      ]),
    }),
    "navigation-rail": Object.freeze({
      id: parseSemanticId("navigation-rail"),
      displayName: "NavigationRail",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "extended",
          control: CONTROL_TYPES.toggle,
          label: "Extended",
          defaultValue: false,
        }),
      ]),
    }),
    "tab-bar": Object.freeze({
      id: parseSemanticId("tab-bar"),
      displayName: "TabBar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "isScrollable",
          control: CONTROL_TYPES.toggle,
          label: "Scrollable",
          defaultValue: false,
        }),
      ]),
    }),
    "search-bar": Object.freeze({
      id: parseSemanticId("search-bar"),
      displayName: "SearchBar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "hintText",
          control: CONTROL_TYPES.text,
          label: "Hint Text",
          defaultValue: "Search...",
        }),
      ]),
    }),
  });
