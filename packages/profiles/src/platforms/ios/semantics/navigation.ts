import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const IOS_NAVIGATION_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze(
  {
    "navigation-bar": Object.freeze({
      id: parseSemanticId("navigation-bar"),
      displayName: "Navigation Bar",
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
          id: "prefersLargeTitles",
          control: CONTROL_TYPES.toggle,
          label: "Large Title",
          defaultValue: false,
        }),
      ]),
    }),
    "tab-bar": Object.freeze({
      id: parseSemanticId("tab-bar"),
      displayName: "Tab Bar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
      properties: Object.freeze([
        Object.freeze({
          id: "translucent",
          control: CONTROL_TYPES.toggle,
          label: "Translucent",
          defaultValue: true,
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
          defaultValue: "Search",
        }),
      ]),
    }),
    toolbar: Object.freeze({
      id: parseSemanticId("toolbar"),
      displayName: "Toolbar",
      category: SEMANTIC_CATEGORIES.navigation,
      scope: "section",
    }),
  },
);
